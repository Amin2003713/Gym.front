'use client'

import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  addWorkoutExercise,
  getWorkout,
  listMyWorkouts,
  searchExercises,
} from '@/app/(tenant)/_api/workout-api'
import {
  normalizeSessionStatus,
  WorkoutSessionStatus,
  type ExerciseSearchItem,
} from '@/app/(tenant)/_model/workout.types'
import {

  Copy,
  Dumbbell,
  Hand,
  Info,
  LogIn,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  PlusCircle,
  Radio,
  Send,
  UserRound,
  Users,
  Video,
  VideoOff,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getBaseURL } from '@/core/http-service/http-service'
import { toast } from '@/lib/toast'

type Mode = 'support' | 'webinar'

type LivePeer = {
  connectionId: string
  displayName: string
  isHost: boolean
  micOn: boolean
  camOn: boolean
  screenSharing: boolean
  handRaised: boolean
}

type LiveExercise = {
  exerciseId: string
  exerciseName: string
  order: number
}

type Snapshot = {
  code: string
  title: string
  mode: Mode
  hostConnectionId: string
  currentExercise: LiveExercise | null
  peers: LivePeer[]
}

type ChatMessage = { from: string; name: string; body: string; at: string }

type Signal = { from: string; kind: 'offer' | 'answer' | 'ice'; payload: string }

/**
 * The hub must live on the same origin as the REST API, tenant subdomain included. Using the raw
 * NEXT_PUBLIC_API_URL sent a tenant page's signaling to https://gymgroup.cv, a different origin,
 * where credentialed SignalR requests fail CORS (the API answers `Access-Control-Allow-Origin: *`).
 */
async function resolveHubUrl() {
  try {
    const { baseURL } = await getBaseURL()
    return secureHubUrl(`${baseURL}/hubs/live`)
  } catch {
    // No API URL configured: stay on the page origin instead of guessing a host.
    return secureHubUrl(
      typeof window === 'undefined' ? '/hubs/live' : `${window.location.origin}/hubs/live`,
    )
  }
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: process.env.NEXT_PUBLIC_STUN_URL || 'stun:stun.l.google.com:19302' },
]

// Accept one or several URLs so a deployment can advertise both a UDP TURN endpoint and a
// TLS `turns:` endpoint. The browser prefers the secure one when the page is served over HTTPS.
const TURN_URLS = (process.env.NEXT_PUBLIC_TURN_URLS || process.env.NEXT_PUBLIC_TURN_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

if (TURN_URLS.length) {
  ICE_SERVERS.push({
    urls: TURN_URLS,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
  })
}

// WebRTC always encrypts media with DTLS-SRTP; the browser refuses a non-secure context for
// camera/microphone access. This also keeps the SignalR signaling socket on WSS when the page is
// served over HTTPS instead of letting the browser block it as mixed content.
function secureHubUrl(url: string) {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:')
    return url.replace(/^http:\/\//i, 'https://')
  return url
}

function mediaError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError')
      return 'دسترسی به دوربین یا میکروفون رد شد. از تنظیمات مرورگر اجازه دهید.'
    if (error.name === 'NotFoundError')
      return 'دوربین یا میکروفون پیدا نشد. اتصال دستگاه را بررسی کنید.'
    if (error.name === 'NotReadableError')
      return 'دوربین یا میکروفون در اختیار برنامهٔ دیگری است.'
  }
  if (!window.isSecureContext)
    return 'برای پخش زنده، صفحه باید روی HTTPS یا localhost باز شود.'
  return error instanceof Error ? error.message : 'آماده‌سازی دوربین ناموفق بود.'
}

function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (/Host|capacity|ظرفیت|اتاق پیدا|میزبان|الزامی/.test(message)) return message
  return 'ارتباط با سرویس پخش زنده برقرار نشد. دوباره تلاش کنید.'
}

export function LiveRoom({ staff = false }: { staff?: boolean }) {
  const [phase, setPhase] = useState<'lobby' | 'room'>('lobby')
  const [mode, setMode] = useState<Mode>('support')
  const [title, setTitle] = useState('جلسهٔ زنده')
  // Staff can start a room with the defaults; a saved name or an edit replaces it before creation.
  const [displayName, setDisplayName] = useState(staff ? 'میزبان' : '')
  const [code, setCode] = useState('')
  const [room, setRoom] = useState<Snapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [screenOn, setScreenOn] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [tab, setTab] = useState<'chat' | 'people'>('chat')
  const [currentExercise, setCurrentExercise] = useState<LiveExercise | null>(null)
  const [autoLog, setAutoLog] = useState(true)
  const [exerciseQuery, setExerciseQuery] = useState('')
  const [exerciseResults, setExerciseResults] = useState<ExerciseSearchItem[]>([])
  const [searchingExercises, setSearchingExercises] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)
  // Camera and microphone are optional: a member on a broken device must still reach the room.
  const [mediaNotice, setMediaNotice] = useState<string | null>(null)

  const hubRef = useRef<HubConnection | null>(null)
  const roomRef = useRef<Snapshot | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const iceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  const chatEndRef = useRef<HTMLDivElement>(null)
  const autoLogRef = useRef(true)
  const loggedExerciseRef = useRef<Set<string>>(new Set())
  const noSessionNotifiedRef = useRef(false)

  // Browser storage is only available after hydration, so read it on the next tick.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedName = localStorage.getItem('live-name')
      if (savedName) setDisplayName(savedName)
      const savedAutoLog = localStorage.getItem('live-autolog')
      if (savedAutoLog === 'off') {
        autoLogRef.current = false
        setAutoLog(false)
      }
      const sharedCode = new URLSearchParams(window.location.search).get('code')
      if (sharedCode) setCode(sharedCode.toUpperCase())
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, tab])

  useEffect(
    () => () => {
      const hub = hubRef.current
      hubRef.current = null
      if (hub?.state === HubConnectionState.Connected) void hub.stop()
      pcsRef.current.forEach((pc) => pc.close())
      pcsRef.current.clear()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
    },
    [],
  )

  const teardown = useCallback(() => {
    pcsRef.current.forEach((pc) => pc.close())
    pcsRef.current.clear()
    iceRef.current.clear()
    screenStreamRef.current?.getTracks().forEach((track) => track.stop())
    screenStreamRef.current = null
    setScreenStream(null)
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStreams({})
    setMicOn(false)
    setCamOn(false)
    setScreenOn(false)
    setHandRaised(false)
    setMessages([])
    setDraft('')
    setCurrentExercise(null)
    setExerciseQuery('')
    setExerciseResults([])
    setSearchingExercises(false)
    setMediaNotice(null)
    loggedExerciseRef.current.clear()
    noSessionNotifiedRef.current = false
    setRoom(null)
    roomRef.current = null
    setSelfId(null)
    setPhase('lobby')
  }, [])

  const shouldPublish = useCallback(() => {
    const current = roomRef.current
    return (
      !!current &&
      (current.mode === 'support' ||
        current.hostConnectionId === hubRef.current?.connectionId)
    )
  }, [])

  const sendSignal = useCallback(
    (target: string, kind: Signal['kind'], payload: string) => {
      void hubRef.current?.send('SendSignal', target, kind, payload).catch(() => {})
    },
    [],
  )

  const flushIce = useCallback(async (from: string, pc: RTCPeerConnection) => {
    const queue = iceRef.current.get(from)
    if (!queue?.length) return
    iceRef.current.delete(from)
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(candidate)
      } catch {
        // A candidate can arrive after the peer closed; the next one will re-negotiate.
      }
    }
  }, [])

  const ensurePeer = useCallback(
    (target: string) => {
      const existing = pcsRef.current.get(target)
      if (existing) return existing

      // `max-bundle` keeps all media on one encrypted transport and `require` forbids fallback
      // RTP; the DTLS fingerprint still authenticates each peer end-to-end.
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 4,
      })
      pcsRef.current.set(target, pc)

      const stream = localStreamRef.current
      if (stream && shouldPublish()) {
        for (const track of stream.getTracks()) pc.addTrack(track, stream)
      } else if (!shouldPublish()) {
        // Viewers still need receiving transceivers or the host's tracks are never negotiated.
        pc.addTransceiver('video', { direction: 'recvonly' })
        pc.addTransceiver('audio', { direction: 'recvonly' })
      }

      pc.onicecandidate = (event) => {
        if (event.candidate)
          sendSignal(target, 'ice', JSON.stringify(event.candidate.toJSON()))
      }
      pc.ontrack = (event) => {
        const remote = event.streams[0]
        if (remote) setRemoteStreams((previous) => ({ ...previous, [target]: remote }))
      }
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close()
          pcsRef.current.delete(target)
          setRemoteStreams((previous) => {
            const next = { ...previous }
            delete next[target]
            return next
          })
        }
      }

      return pc
    },
    [sendSignal, shouldPublish],
  )

  const negotiate = useCallback(
    async (target: string) => {
      try {
        const pc = ensurePeer(target)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sendSignal(target, 'offer', JSON.stringify(offer))
      } catch {
        setError('برقراری ارتباط تصویری با یکی از شرکت‌کنندگان ناموفق بود.')
      }
    },
    [ensurePeer, sendSignal],
  )

  const applySignal = useCallback(
    async (signal: Signal) => {
      try {
        const { from, kind, payload } = signal

        if (kind === 'offer') {
          const pc = ensurePeer(from)
          await pc.setRemoteDescription(JSON.parse(payload))
          await flushIce(from, pc)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSignal(from, 'answer', JSON.stringify(answer))
          return
        }

        if (kind === 'answer') {
          const pc = pcsRef.current.get(from)
          if (!pc) return
          await pc.setRemoteDescription(JSON.parse(payload))
          await flushIce(from, pc)
          return
        }

        if (kind === 'ice') {
          const candidate = JSON.parse(payload) as RTCIceCandidateInit
          const pc = pcsRef.current.get(from)
          if (pc?.remoteDescription) await pc.addIceCandidate(candidate)
          else {
            const queue = iceRef.current.get(from) ?? []
            queue.push(candidate)
            iceRef.current.set(from, queue)
          }
        }
      } catch {
        // A failed single negotiation should not take down the room.
      }
    },
    [ensurePeer, flushIce, sendSignal],
  )

  const removePeer = useCallback((connectionId: string) => {
    const pc = pcsRef.current.get(connectionId)
    pc?.close()
    pcsRef.current.delete(connectionId)
    iceRef.current.delete(connectionId)
    setRemoteStreams((previous) => {
      const next = { ...previous }
      delete next[connectionId]
      return next
    })
    setRoom((previous) =>
      previous
        ? {
            ...previous,
            peers: previous.peers.filter((peer) => peer.connectionId !== connectionId),
          }
        : previous,
    )
  }, [])

  /**
   * Adds the host's current exercise to the member's open workout. Only the exercise is added;
   * reps/weight stay the member's own, so the training record is never fabricated.
   */
  const addExerciseToWorkout = useCallback(
    async (exercise: LiveExercise, automatic: boolean) => {
      try {
        const mine = await listMyWorkouts(undefined, null, 10)
        const rows = Array.isArray(mine) ? mine : (mine.items ?? mine.results ?? [])
        const active = rows.find(
          (row) => normalizeSessionStatus(row.status) === WorkoutSessionStatus.InProgress,
        )

        if (!active) {
          if (automatic) {
            if (noSessionNotifiedRef.current) return
            noSessionNotifiedRef.current = true
          }

          toast.info('تمرین فعالی پیدا نشد', {
            description:
              'برای ثبت حرکات کلاس، از صفحه تمرین یک جلسه را شروع کنید.',
          })
          return
        }

        const sessionId = active.sessionId ?? active.id
        const session = await getWorkout(sessionId)

        if (session.exercises?.some((item) => item.exerciseId === exercise.exerciseId))
          return

        await addWorkoutExercise(sessionId, { exerciseId: exercise.exerciseId })
        toast.success(`«${exercise.exerciseName}» به تمرین امروز اضافه شد`)
      } catch (cause) {
        if (!automatic)
          toast.error('افزودن حرکت به تمرین ناموفق بود.', {
            description: cause instanceof Error ? cause.message : undefined,
          })
      }
    },
    [],
  )

  const mirrorExercise = useCallback(
    (exercise: LiveExercise) => {
      setCurrentExercise(exercise)

      if (!autoLogRef.current) return

      const current = roomRef.current
      const hub = hubRef.current

      // Hosts run the class; only participants mirror into their own workout.
      if (!current || !hub || current.hostConnectionId === hub.connectionId) return
      if (loggedExerciseRef.current.has(exercise.exerciseId)) return

      loggedExerciseRef.current.add(exercise.exerciseId)
      void addExerciseToWorkout(exercise, true)
    },
    [addExerciseToWorkout],
  )

  const attachHandlers = useCallback(
    (connection: HubConnection) => {
      connection.on('peer-joined', (peer: LivePeer) => {
        setRoom((previous) =>
          previous
            ? {
                ...previous,
                peers: [
                  ...previous.peers.filter((item) => item.connectionId !== peer.connectionId),
                  peer,
                ],
              }
            : previous,
        )
      })

      connection.on('peer-left', (connectionId: string) => removePeer(connectionId))

      connection.on('peer-media', (payload: {
        connectionId: string
        micOn: boolean
        camOn: boolean
        screenSharing: boolean
      }) => {
        setRoom((previous) =>
          previous
            ? {
                ...previous,
                peers: previous.peers.map((peer) =>
                  peer.connectionId === payload.connectionId
                    ? {
                        ...peer,
                        micOn: payload.micOn,
                        camOn: payload.camOn,
                        screenSharing: payload.screenSharing,
                      }
                    : peer,
                ),
              }
            : previous,
        )
      })

      connection.on('hand', (payload: { connectionId: string; raised: boolean }) => {
        setRoom((previous) =>
          previous
            ? {
                ...previous,
                peers: previous.peers.map((peer) =>
                  peer.connectionId === payload.connectionId
                    ? { ...peer, handRaised: payload.raised }
                    : peer,
                ),
              }
            : previous,
        )
      })

      connection.on('signal', (signal: Signal) => void applySignal(signal))
      connection.on('exercise-selected', (exercise: LiveExercise) =>
        mirrorExercise(exercise),
      )
      connection.on('exercise-cleared', () => setCurrentExercise(null))
      connection.on('chat', (message: ChatMessage) => {
        setMessages((previous) => [...previous.slice(-199), message])
      })
      connection.on('ended', () => {
        teardown()
        setError('جلسه پایان یافت.')
      })
      connection.onreconnecting(() => setError('اتصال قطع شد؛ در حال اتصال دوباره...'))
      connection.onreconnected(() => setError(null))
    },
    [applySignal, mirrorExercise, removePeer, teardown],
  )

  const connect = useCallback(async () => {
    if (hubRef.current) return hubRef.current
    const connection = new HubConnectionBuilder()
      .withUrl(await resolveHubUrl())
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build()

    attachHandlers(connection)
    await connection.start()
    hubRef.current = connection
    setSelfId(connection.connectionId ?? null)
    return connection
  }, [attachHandlers])

  /**
   * Best-effort device setup. It never throws: a missing, busy or denied camera must not stop a
   * member from joining a class or a trainer from opening a support room. The room simply starts
   * with chat/hand-raising and the user can switch devices on from the call bar afterwards.
   */
  const acquireMedia = useCallback(async (): Promise<MediaStream | null> => {
    setMediaNotice(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMediaNotice('این مرورگر دوربین یا میکروفون را در اختیار برنامه نمی‌گذارد؛ بدون تصویر وارد شدید.')
      return null
    }

    if (!window.isSecureContext) {
      setMediaNotice('برای روشن کردن دوربین، صفحه باید روی HTTPS باز شود؛ اکنون بدون تصویر وارد شده‌اید.')
      return null
    }

    // Ask for both first, then degrade to audio-only / video-only so a single missing device
    // does not cost the user the other one.
    const attempts: MediaStreamConstraints[] = [
      { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { audio: true, video: false },
      { audio: false, video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
    ]

    let lastError: unknown = null

    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        localStreamRef.current = stream
        setLocalStream(stream)
        setMicOn(stream.getAudioTracks().length > 0)
        setCamOn(stream.getVideoTracks().length > 0)

        if (stream.getVideoTracks().length === 0)
          setMediaNotice('دوربین در دسترس نبود؛ با میکروفون وارد شدید. می‌توانید بعداً دوربین را روشن کنید.')
        else if (stream.getAudioTracks().length === 0)
          setMediaNotice('میکروفون در دسترس نبود؛ با دوربین وارد شدید. می‌توانید بعداً میکروفون را روشن کنید.')

        return stream
      } catch (cause) {
        lastError = cause
      }
    }

    setMediaNotice(
      `${mediaError(lastError)} بدون دوربین و میکروفون هم می‌توانید در کلاس بمانید و از گفتگو استفاده کنید.`,
    )
    return null
  }, [])

  /** Turns one device on after joining (or retries a permission the user just allowed). */
  const enableMedia = useCallback(
    async (kind: 'audio' | 'video') => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMediaNotice('این مرورگر دسترسی به دستگاه را پشتیبانی نمی‌کند.')
        return
      }

      try {
        const added = await navigator.mediaDevices.getUserMedia(
          kind === 'audio'
            ? { audio: true }
            : { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        )
        const track = kind === 'audio' ? added.getAudioTracks()[0] : added.getVideoTracks()[0]
        if (!track) return

        let current = localStreamRef.current
        if (!current) {
          current = new MediaStream()
          localStreamRef.current = current
        }
        current.addTrack(track)
        setLocalStream(current)
        setMicOn(current.getAudioTracks().some((candidate) => candidate.enabled))
        setCamOn(current.getVideoTracks().some((candidate) => candidate.enabled))
        setMediaNotice(null)

        if (shouldPublish()) {
          for (const [target, pc] of pcsRef.current) {
            const sender = pc.getSenders().find((candidate) => candidate.track?.kind === track.kind)
            if (sender) await sender.replaceTrack(track).catch(() => {})
            else pc.addTrack(track, current)
            void negotiate(target)
          }
        }

        void hubRef.current
          ?.send(
            'SetMediaState',
            current.getAudioTracks().some((candidate) => candidate.enabled),
            current.getVideoTracks().some((candidate) => candidate.enabled),
            screenOn,
          )
          .catch(() => {})
      } catch (cause) {
        setMediaNotice(`${mediaError(cause)} می‌توانید بدون این دستگاه ادامه دهید.`)
      }
    },
    [negotiate, screenOn, shouldPublish],
  )

  const persistName = useCallback((name: string) => {
    localStorage.setItem('live-name', name)
  }, [])

  const createRoom = async () => {
    setError(null)
    const name = displayName.trim()
    if (name.length < 2) return setError('نام نمایشی را وارد کنید.')

    setBusy(true)
    try {
      const stream = await acquireMedia()
      const connection = await connect()
      const snapshot = await connection.invoke<Snapshot>(
        'CreateRoom',
        title.trim() || 'جلسهٔ زنده',
        mode,
        name,
      )
      roomRef.current = snapshot
      setRoom(snapshot)
      setCurrentExercise(null)
      setPhase('room')
      persistName(name)
      void connection
        .send(
          'SetMediaState',
          !!stream?.getAudioTracks().length,
          !!stream?.getVideoTracks().length,
          false,
        )
        .catch(() => {})
    } catch (cause) {
      setError(errorText(cause))
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async () => {
    setError(null)
    const name = displayName.trim()
    if (name.length < 2) return setError('نام نمایشی را وارد کنید.')
    if (code.trim().length < 4) return setError('کد اتاق را وارد کنید.')

    setBusy(true)
    try {
      const connection = await connect()
      const snapshot = await connection.invoke<Snapshot>('JoinRoom', code.trim(), name)
      roomRef.current = snapshot
      setRoom(snapshot)
      setCurrentExercise(snapshot.currentExercise ?? null)
      setPhase('room')
      persistName(name)

      if (snapshot.currentExercise) mirrorExercise(snapshot.currentExercise)

      const joiningAsHost = snapshot.hostConnectionId === connection.connectionId
      if (snapshot.mode === 'support' || joiningAsHost) {
        const stream = await acquireMedia()
        void connection
          .send(
            'SetMediaState',
            !!stream?.getAudioTracks().length,
            !!stream?.getVideoTracks().length,
            false,
          )
          .catch(() => {})
      }

      const targets =
        snapshot.mode === 'webinar'
          ? snapshot.peers.filter(
              (peer) =>
                peer.connectionId === snapshot.hostConnectionId &&
                peer.connectionId !== connection.connectionId,
            )
          : snapshot.peers.filter((peer) => peer.connectionId !== connection.connectionId)

      for (const peer of targets) void negotiate(peer.connectionId)
    } catch (cause) {
      if (!roomRef.current)
        setError(
          /Media|Permission|secure/i.test(cause instanceof Error ? cause.message : '')
            ? mediaError(cause)
            : errorText(cause),
        )
    } finally {
      setBusy(false)
    }
  }

  const leave = useCallback(async () => {
    const hub = hubRef.current
    try {
      if (hub?.state === HubConnectionState.Connected) await hub.invoke('LeaveRoom')
    } catch {
      // Leaving is best-effort; the server also drops the peer on disconnect.
    }
    if (hub) await hub.stop().catch(() => {})
    hubRef.current = null
    teardown()
  }, [teardown])

  const endRoom = async () => {
    try {
      await hubRef.current?.invoke('EndRoom')
    } catch (cause) {
      toast.error(errorText(cause))
    } finally {
      await leave()
    }
  }

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) {
      void enableMedia('audio')
      return
    }
    track.enabled = !track.enabled
    setMicOn(track.enabled)
    const camera = localStreamRef.current?.getVideoTracks()[0]?.enabled ?? false
    void hubRef.current
      ?.send('SetMediaState', track.enabled, camera && !screenOn, screenOn)
      .catch(() => {})
  }

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) {
      void enableMedia('video')
      return
    }
    track.enabled = !track.enabled
    setCamOn(track.enabled)
    const mic = localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false
    void hubRef.current
      ?.send('SetMediaState', mic, track.enabled && !screenOn, screenOn)
      .catch(() => {})
  }

  const stopScreen = useCallback(async () => {
    const screen = screenStreamRef.current
    if (!screen) return
    screen.getTracks().forEach((track) => track.stop())
    screenStreamRef.current = null
    setScreenStream(null)
    setScreenOn(false)

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null
    for (const pc of pcsRef.current.values()) {
      const sender = pc.getSenders().find((candidate) => candidate.track?.kind === 'video')
      if (sender) await sender.replaceTrack(cameraTrack).catch(() => {})
    }
    const mic = localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false
    const camera = cameraTrack?.enabled ?? false
    void hubRef.current?.send('SetMediaState', mic, camera, false).catch(() => {})
  }, [])

  const toggleScreen = async () => {
    if (screenOn) {
      await stopScreen()
      return
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const track = display.getVideoTracks()[0]
      screenStreamRef.current = display
      setScreenStream(display)
      setScreenOn(true)
      for (const pc of pcsRef.current.values()) {
        const sender = pc.getSenders().find((candidate) => candidate.track?.kind === 'video')
        if (sender) await sender.replaceTrack(track).catch(() => {})
      }
      track.onended = () => void stopScreen()
      const mic = localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false
      void hubRef.current?.send('SetMediaState', mic, false, true).catch(() => {})
    } catch {
      setError('اشتراک‌گذاری صفحه انجام نشد.')
    }
  }

  const toggleHand = () => {
    const next = !handRaised
    setHandRaised(next)
    void hubRef.current?.send('RaiseHand', next).catch(() => {})
  }

  const sendChat = () => {
    const body = draft.trim()
    if (!body) return
    setDraft('')
    void hubRef.current?.send('SendChat', body).catch(() => {
      toast.error('ارسال پیام ناموفق بود')
    })
  }

  const copyInvite = async () => {
    if (!room) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/live?code=${room.code}`)
      toast.success('لینک اتاق کپی شد')
    } catch {
      toast.error('کپی لینک ناموفق بود؛ کد اتاق را دستی هم‌رسان کنید.')
    }
  }

  const isHost = !!room && room.hostConnectionId === selfId

  useEffect(() => {
    if (!isHost) return

    const query = exerciseQuery.trim()
    if (query.length < 2) return

    let cancelled = false

    const timer = window.setTimeout(() => {
      if (cancelled) return
      void searchExercises({ query, pageSize: 12 })
        .then((response) => {
          if (!cancelled) setExerciseResults(response.items ?? [])
        })
        .catch(() => {
          if (!cancelled) setExerciseResults([])
        })
        .finally(() => {
          if (!cancelled) setSearchingExercises(false)
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [exerciseQuery, isHost])

  const selectExercise = async (item: ExerciseSearchItem) => {
    const hub = hubRef.current
    if (!hub) return

    try {
      await hub.invoke(
        'SetCurrentExercise',
        item.id,
        item.name,
        (currentExercise?.order ?? 0) + 1,
      )
      setExerciseQuery('')
      setExerciseResults([])
    } catch (cause) {
      toast.error('انتخاب حرکت برای کلاس ناموفق بود.', {
        description: cause instanceof Error ? cause.message : undefined,
      })
    }
  }

  const clearExercise = async () => {
    try {
      await hubRef.current?.invoke('ClearCurrentExercise')
    } catch {
      // The host may have already closed the room.
    }
  }

  const toggleAutoLog = (next: boolean) => {
    autoLogRef.current = next
    setAutoLog(next)
    localStorage.setItem('live-autolog', next ? 'on' : 'off')
  }

  if (phase === 'lobby' || !room) {
    return (
      <div dir="rtl" className="mx-auto w-full max-w-4xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg">
              <Radio className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">کلاس آنلاین</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {staff
                  ? 'یک جلسهٔ پشتیبانی تصویری یا وبینار داخلی بسازید.'
                  : 'در جلسهٔ زندهٔ مربی شرکت کنید یا اتاق خودتان را بسازید.'}
              </p>
            </div>
          </div>
          <span className="border-border text-muted-foreground rounded-full border px-3 py-1 text-[11px] font-bold">
            داخلی · بدون ذخیره‌سازی
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
          >
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">نام نمایشی</span>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="مثلاً سارا محمدی"
                maxLength={40}
                autoComplete="name"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <section className="border-border space-y-3 rounded-lg border p-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold">
                  <PlusCircle className="text-primary size-4" />
                  ساخت اتاق
                </h2>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="عنوان جلسه"
                  maxLength={80}
                  aria-label="عنوان جلسه"
                />
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="نوع جلسه">
                  {(
                    [
                      ['support', 'جلسهٔ پشتیبانی', 'همه صحبت می‌کنند'],
                      ['webinar', 'وبینار', 'میزبان پخش می‌کند'],
                    ] as const
                  ).map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`rounded-lg border p-3 text-start transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                        mode === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="text-muted-foreground mt-0.5 block text-[11px]">{hint}</span>
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={() => void createRoom()} disabled={busy}>
                  {busy ? 'در حال آماده‌سازی...' : 'ساخت و شروع جلسه'}
                </Button>
                <p className="text-muted-foreground text-[11px] leading-5">
                  دوربین و میکروفون فقط پس از اجازهٔ شما فعال می‌شوند. بدون این دو دستگاه هم
                  می‌توانید جلسه بسازید یا وارد شوید.
                </p>
              </section>

              <section className="border-border space-y-3 rounded-lg border p-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold">
                  <LogIn className="text-primary size-4" />
                  ورود با کد
                </h2>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="کد ۶ رقمی اتاق"
                  maxLength={12}
                  dir="ltr"
                  className="text-center font-mono tracking-[0.35em]"
                  aria-label="کد اتاق"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void joinRoom()}
                  disabled={busy || code.trim().length < 4}
                >
                  ورود به اتاق
                </Button>
                <p className="text-muted-foreground text-[11px] leading-5">
                  لینک اتاق را فقط با افراد مورد اعتماد به اشتراک بگذارید؛ هر کسی که کد را
                  داشته باشد می‌تواند وارد شود.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground flex items-start gap-2 text-xs leading-6">
          <Info className="mt-1 size-3.5 shrink-0" />
          این اتاق‌ها همتا‌به‌همتا (P2P) هستند، تصویر از سرور عبور نمی‌کند و رسانه با
          DTLS-SRTP رمزنگاری می‌شود. برای شبکه‌های محدود، یک TURN امن با آدرس
          <span dir="ltr"> turns: </span>
          تنظیم کنید.
        </p>
      </div>
    )
  }

  const tiles =
    room.mode === 'webinar'
      ? room.peers.filter(
          (peer) => peer.connectionId === selfId || peer.connectionId === room.hostConnectionId,
        )
      : room.peers

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-destructive size-2 animate-pulse rounded-full" aria-hidden />
            <h1 className="truncate text-lg font-extrabold sm:text-xl">{room.title}</h1>
            <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] font-bold">
              {room.mode === 'webinar' ? 'وبینار' : 'جلسهٔ پشتیبانی'}
            </span>
            {isHost && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                میزبان
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
            <Users className="size-3.5" />
            {room.peers.length} نفر
            <span aria-hidden>·</span>
            کد اتاق
            <button
              type="button"
              onClick={() => void copyInvite()}
              className="text-foreground hover:text-primary inline-flex items-center gap-1 font-mono font-bold tracking-widest transition"
              title="کپی لینک اتاق"
            >
              {room.code}
              <Copy className="size-3" />
            </button>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-destructive hidden text-xs sm:inline" role="status">
              {error}
            </span>
          )}
          {isHost ? (
            <Button variant="outline" onClick={() => void endRoom()}>
              <PhoneOff className="me-2 size-4" />
              پایان جلسه
            </Button>
          ) : (
            <Button variant="outline" onClick={() => void leave()}>
              <PhoneOff className="me-2 size-4" />
              خروج
            </Button>
          )}
        </div>
      </div>

      {mediaNotice && (
        <div
          role="status"
          className="border-warning/40 bg-warning/10 text-foreground flex flex-wrap items-center gap-2 rounded-xl border p-3 text-xs leading-6"
        >
          <Info className="text-warning size-4 shrink-0" />
          <p className="min-w-0 flex-1">{mediaNotice}</p>
          <Button size="sm" variant="outline" onClick={() => void enableMedia('audio')}>
            روشن کردن میکروفون
          </Button>
          <Button size="sm" variant="outline" onClick={() => void enableMedia('video')}>
            روشن کردن دوربین
          </Button>
        </div>
      )}

      {currentExercise && (
        <div
          aria-live="polite"
          className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-3"
        >
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Dumbbell className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[11px] font-bold">
              حرکت جاری کلاس · مرحله {currentExercise.order.toLocaleString('fa-IR')}
            </p>
            <p className="truncate text-sm font-extrabold">
              {currentExercise.exerciseName}
            </p>
          </div>

          {isHost ? (
            <Button size="sm" variant="outline" onClick={() => void clearExercise()}>
              پایان حرکت
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={autoLog}
                  onChange={(event) => toggleAutoLog(event.target.checked)}
                  className="size-4 accent-current"
                />
                ثبت خودکار
              </label>

              <Button
                size="sm"
                variant="outline"
                onClick={() => void addExerciseToWorkout(currentExercise, false)}
              >
                افزودن به تمرین امروز
              </Button>
            </div>
          )}
        </div>
      )}

      {isHost && (
        <div className="bg-card rounded-xl border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-extrabold">حرکت کلاس را انتخاب کنید</p>
            <p className="text-muted-foreground text-[11px]">
              شرکت‌کننده‌ها همین حرکت را در تمرین خود می‌بینند.
            </p>
          </div>

          <Input
            value={exerciseQuery}
            onChange={(event) => {
              const next = event.target.value
              setExerciseQuery(next)
              if (next.trim().length < 2) {
                setExerciseResults([])
                setSearchingExercises(false)
              }
            }}
            placeholder="جستجوی نام حرکت..."
            className="mt-2"
            aria-label="جستجوی حرکت برای کلاس"
          />

          {exerciseQuery.trim().length >= 2 && (
            <ul className="mt-2 max-h-56 divide-y overflow-y-auto rounded-lg border">
              {searchingExercises ? (
                <li className="text-muted-foreground p-3 text-xs">در حال جستجو…</li>
              ) : exerciseResults.length === 0 ? (
                <li className="text-muted-foreground p-3 text-xs">حرکتی پیدا نشد.</li>
              ) : (
                exerciseResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void selectExercise(item)}
                      className="hover:bg-muted flex w-full items-center gap-2 p-3 text-start"
                    >
                      <Dumbbell className="text-muted-foreground size-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {item.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-[11px]">
                          {[item.target, item.equipment].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          {tiles.length === 0 ? (
            <div className="border-border bg-muted/20 grid min-h-[280px] place-items-center rounded-xl border border-dashed text-center">
              <div>
                <Users className="text-muted-foreground/50 mx-auto mb-2 size-9" />
                <p className="text-sm font-semibold">در انتظار شرکت‌کنندگان</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  کد {room.code} را هم‌رسان کنید.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {tiles.map((peer) => {
                const self = peer.connectionId === selfId
                const stream = self
                  ? (screenStream ?? localStream)
                  : remoteStreams[peer.connectionId]
                return (
                  <VideoTile
                    key={peer.connectionId}
                    stream={stream ?? null}
                    label={`${peer.displayName}${self ? ' (شما)' : ''}`}
                    isHost={peer.isHost}
                    muted={self}
                    micOn={self ? micOn : peer.micOn}
                    camOn={self ? camOn : peer.camOn}
                    screenSharing={self ? screenOn : peer.screenSharing}
                  />
                )
              })}
            </div>
          )}

          <div className="bg-card flex flex-wrap items-center justify-center gap-2 rounded-xl border p-2.5">
            <ControlButton
              label={micOn ? 'بی‌صدا' : 'روشن کردن میکروفون'}
              active={micOn}
              onClick={toggleMic}
            >
              {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
            </ControlButton>
            <ControlButton
              label={camOn ? 'خاموش کردن دوربین' : 'روشن کردن دوربین'}
              active={camOn}
              onClick={toggleCam}
            >
              {camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
            </ControlButton>
            {(room.mode === 'support' || isHost) && (
              <ControlButton
                label={screenOn ? 'پایان اشتراک صفحه' : 'اشتراک صفحه'}
                active={screenOn}
                onClick={() => void toggleScreen()}
                disabled={!localStream}
              >
                <MonitorUp className="size-5" />
              </ControlButton>
            )}
            {!isHost && (
              <ControlButton
                label={handRaised ? 'پایین آوردن دست' : 'بالا بردن دست'}
                active={handRaised}
                onClick={toggleHand}
              >
                <Hand className="size-5" />
              </ControlButton>
            )}
            <ControlButton label="کپی لینک" onClick={() => void copyInvite()}>
              <Copy className="size-5" />
            </ControlButton>
            <button
              type="button"
              onClick={() => void leave()}
              className="text-destructive hover:bg-destructive/10 inline-flex h-11 items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-bold transition"
            >
              <PhoneOff className="size-5" />
              خروج
            </button>
          </div>
        </div>

        <aside className="bg-card flex h-[420px] flex-col rounded-xl border lg:h-[calc(100vh-13rem)]">
          <div className="border-border flex border-b p-1.5">
            {(
              [
                ['chat', 'گفتگو', MessageSquare],
                ['people', 'شرکت‌کنندگان', Users],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-bold transition ${
                  tab === value ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {label}
                {value === 'people' && ` (${room.peers.length})`}
              </button>
            ))}
          </div>

          {tab === 'chat' ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-xs">
                    هنوز پیامی فرستاده نشده است.
                  </p>
                ) : (
                  messages.map((message, index) => {
                    const mine = message.from === selfId
                    return (
                      <div
                        key={`${message.at}-${index}`}
                        className={`max-w-[92%] rounded-lg p-2.5 text-sm ${
                          mine ? 'bg-primary/10 ms-auto' : 'bg-muted/50 me-auto'
                        }`}
                      >
                        <p className="text-muted-foreground mb-1 text-[10px] font-bold">
                          {mine ? 'شما' : message.name}
                        </p>
                        <p className="leading-6 break-words whitespace-pre-wrap">{message.body}</p>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2 border-t p-2">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      sendChat()
                    }
                  }}
                  placeholder="پیام..."
                  aria-label="پیام گفتگو"
                />
                <Button
                  size="icon"
                  onClick={sendChat}
                  disabled={!draft.trim()}
                  aria-label="ارسال پیام"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <ul className="flex-1 space-y-1 overflow-y-auto p-2">
              {room.peers.map((peer) => (
                <li
                  key={peer.connectionId}
                  className="hover:bg-muted/40 flex items-center gap-2 rounded-lg p-2"
                >
                  <span className="bg-muted grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold">
                    {peer.displayName.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {peer.displayName}
                    {peer.connectionId === selfId ? ' (شما)' : ''}
                  </span>
                  {peer.isHost && (
                    <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      میزبان
                    </span>
                  )}
                  {peer.handRaised && <Hand className="size-4 text-amber-500" />}
                  {peer.screenSharing ? (
                    <MonitorUp className="text-primary size-4" />
                  ) : peer.camOn ? (
                    <Video className="text-muted-foreground size-4" />
                  ) : (
                    <VideoOff className="text-muted-foreground/60 size-4" />
                  )}
                  {peer.micOn ? (
                    <Mic className="text-muted-foreground size-4" />
                  ) : (
                    <MicOff className="text-muted-foreground/60 size-4" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {error && (
        <p className="text-destructive flex items-center gap-1.5 text-xs" role="status">
          <Info className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}

function VideoTile({
  stream,
  label,
  isHost,
  muted,
  micOn,
  camOn,
  screenSharing,
}: {
  stream: MediaStream | null
  label: string
  isHost: boolean
  muted: boolean
  micOn: boolean
  camOn: boolean
  screenSharing: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.srcObject = stream
    return () => {
      video.srcObject = null
    }
  }, [stream])

  return (
    <div className="bg-muted relative aspect-video overflow-hidden rounded-xl border">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${screenSharing ? 'object-contain' : ''}`}
        />
      ) : (
        <div className="text-muted-foreground grid h-full place-items-center">
          <div className="text-center">
            <span className="bg-background mx-auto grid size-14 place-items-center rounded-full border">
              <UserRound className="size-6" />
            </span>
            <p className="mt-2 text-xs">در انتظار تصویر...</p>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent p-2 text-[11px] text-white">
        <span className="truncate">
          {label}
          {isHost ? ' · میزبان' : ''}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {screenSharing ? (
            <MonitorUp className="size-3.5" />
          ) : camOn ? (
            <Video className="size-3.5" />
          ) : (
            <VideoOff className="size-3.5" />
          )}
          {micOn ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
        </span>
      </div>
    </div>
  )
}

function ControlButton({
  children,
  label,
  active,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex size-11 items-center justify-center rounded-lg border transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40 ${
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
