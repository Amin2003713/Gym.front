'use client'

import {useEffect, useState} from 'react'
import {MUSCLES, INERT, MUSCLE_NAME, levelsOf} from '@/lib/muscles'

type Gender = 'male' | 'female'
type ViewData = { vb: string; p: Record<string, string[]> }
type BodyPaths = Record<Gender, { front: ViewData; back: ViewData }>

let CACHE: BodyPaths | null = null // shared across every mounted map
let PENDING: Promise<BodyPaths> | null = null

function useBodyPaths() {
    const [paths, setPaths] = useState<BodyPaths | null>(CACHE)
    useEffect(() => {
        if (CACHE) return
        let alive = true
        PENDING = PENDING || import('../../../lib/body-paths').then(m => (CACHE = m.default as BodyPaths))
        PENDING.then(p => {
            if (alive) setPaths(p)
        }).catch(() => {
        })
        return () => {
            alive = false
        }
    }, [])
    return paths
}

export type BodyMapPalette = 'load' | 'recovery'

type ViewProps = {
    view: ViewData
    levels: Record<string, number>
    onMuscle?: (slug: string) => void
    selected?: string
}

function View({view, levels, onMuscle, selected}: ViewProps) {
    const activate = (event: React.KeyboardEvent, slug: string) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        if (event.key === ' ') event.preventDefault()
        onMuscle?.(slug)
    }
    return (
        <svg className="bm-v" viewBox={view.vb} role={onMuscle ? 'group' : 'img'}>
            {INERT.map((slug: string) => (view.p[slug] || []).map((d, i) =>
                <path key={slug + i} className="bm-sil" d={d}/>))}
            {MUSCLES.map((slug: string) => (view.p[slug] || []).map((d, i) =>
                <path
                    key={slug + i}
                    className={'bm-m l' + (levels[slug] || 0) + (selected === slug ? ' sel' : '')}
                    d={d}
                    onClick={onMuscle ? () => onMuscle(slug) : undefined}
                    onKeyDown={onMuscle ? e => activate(e, slug) : undefined}
                    role={onMuscle ? 'button' : undefined}
                    tabIndex={onMuscle ? 0 : undefined}
                    aria-label={onMuscle ? (MUSCLE_NAME[slug]) : undefined}
                    aria-pressed={onMuscle ? selected === slug : undefined}
                >
                    <title>{(MUSCLE_NAME[slug])}</title>
                </path>))}
        </svg>
    )
}

type BodyMapProps = {
    load?: Record<string, number>
    thresholds?: { at: number; level: number; exclusive?: boolean }[]
    body?: Gender
    onMuscle?: (slug: string) => void
    selected?: string
    className?: string
    /** 'load' = green scale (more trained = greener); 'recovery' = blue scale with red for insufficient recovery. */
    palette?: BodyMapPalette
}

export default function BodyMap({
                                    load = {},
                                    thresholds,
                                    body = 'male',
                                    onMuscle,
                                    selected,
                                    className = '',
                                    palette = 'load'
                                }: BodyMapProps) {
    const paths = useBodyPaths()
    const levels = levelsOf(load, thresholds)
    const g = paths && (paths[body] || paths.male)
    return (
        <div className={'bodymap ' + className} data-palette={palette}>
            {g ? <>
                <View view={g.front} levels={levels} onMuscle={onMuscle} selected={selected}/>
                <View view={g.back} levels={levels} onMuscle={onMuscle} selected={selected}/>
            </> : <div className="bm-ph" aria-hidden="true"/>}
        </div>
    )
}

const legends = {
    load: ['کم‌کارکرد', <div className="hm-c l0" key="l0"/>, <div className="hm-c g1" key="g1"/>,
        <div className="hm-c g2" key="g2"/>, <div className="hm-c g3" key="g3"/>, <div className="hm-c g4" key="g4"/>,
        'بیش‌کارکرد'],
    recovery: ['نیاز به ریکاوری', <div className="hm-c r0" key="r0"/>, <div className="hm-c r1" key="r1"/>,
        <div className="hm-c b1" key="b1"/>, <div className="hm-c b2" key="b2"/>, <div className="hm-c b3" key="b3"/>,
        'رکاوری کامل'],
} as const

export function BodyMapLegend({palette = 'load'}: { palette?: BodyMapPalette }) {
    return <div className="hm-legend" aria-label="کمتر تا بیشتر">
        {legends[palette].map((part, index) => <span key={index}>{part}</span>)}
    </div>
}
