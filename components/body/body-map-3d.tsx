'use client'

import { Canvas } from '@react-three/fiber'
import { useMemo, useState } from 'react'

import { BODY_REGIONS, type BodyRegion } from '@/lib/body-regions'

export interface BodyMap3DProps {
  /** 0..1 intensity per region; missing regions render neutral. */
  values?: Partial<Record<BodyRegion, number>>
  /** Explicit colour per region; wins over `values`. */
  colors?: Partial<Record<BodyRegion, string>>
  selected?: BodyRegion | null
  onSelect?: (region: BodyRegion) => void
  baseColor?: string
  activeColor?: string
  height?: number
  className?: string
}

/** Linear blend from the neutral body tone to the active tone. */
function mix(from: string, to: string, amount: number) {
  const parse = (hex: string) => {
    const value = hex.replace('#', '')
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value

    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ]
  }

  const [r1, g1, b1] = parse(from)
  const [r2, g2, b2] = parse(to)
  const ratio = Math.min(1, Math.max(0, amount))

  const channel = (a: number, b: number) =>
    Math.round(a + (b - a) * ratio)
      .toString(16)
      .padStart(2, '0')

  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`
}

interface PartProps {
  region: BodyRegion
  color: string
  selected: boolean
  onSelect?: (region: BodyRegion) => void
  position: [number, number, number]
  rotation?: [number, number, number]
  children: React.ReactNode
}

function Part({
  region,
  color,
  selected,
  onSelect,
  position,
  rotation,
  children,
}: PartProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <mesh
      position={position}
      rotation={rotation}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
        if (onSelect) document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.(region)
      }}
    >
      {children}
      <meshStandardMaterial
        color={color}
        roughness={0.62}
        metalness={0.05}
        emissive={hovered || selected ? color : '#000000'}
        emissiveIntensity={hovered ? 0.3 : selected ? 0.16 : 0}
      />
    </mesh>
  )
}

function Figure({
  values,
  colors,
  selected,
  onSelect,
  baseColor,
  activeColor,
}: Required<Pick<BodyMap3DProps, 'baseColor' | 'activeColor'>> &
  Pick<BodyMap3DProps, 'values' | 'colors' | 'selected' | 'onSelect'>) {
  const colorOf = (region: BodyRegion) => {
    if (colors?.[region]) return colors[region] as string

    const value = values?.[region]

    return value == null ? baseColor : mix(baseColor, activeColor, value)
  }

  const part = (region: BodyRegion) =>
    colorOf(region) as string

  const common = (region: BodyRegion) => ({
    region,
    color: part(region),
    selected: selected === region,
    onSelect,
  })

  return (
    <group position={[0, -0.78, 0]}>
      {/* head */}
      <Part {...common('neck')} position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.17, 32, 24]} />
      </Part>

      {/* neck */}
      <Part {...common('neck')} position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.14, 20]} />
      </Part>

      {/* shoulders */}
      <Part {...common('shoulders')} position={[0.29, 1.27, 0]}>
        <sphereGeometry args={[0.125, 24, 18]} />
      </Part>
      <Part {...common('shoulders')} position={[-0.29, 1.27, 0]}>
        <sphereGeometry args={[0.125, 24, 18]} />
      </Part>

      {/* chest */}
      <Part {...common('chest')} position={[0, 1.13, 0]}>
        <boxGeometry args={[0.52, 0.3, 0.26]} />
      </Part>

      {/* back */}
      <Part {...common('back')} position={[0, 1.1, -0.14]}>
        <boxGeometry args={[0.46, 0.36, 0.08]} />
      </Part>

      {/* abs */}
      <Part {...common('abs')} position={[0, 0.88, 0]}>
        <boxGeometry args={[0.36, 0.26, 0.24]} />
      </Part>

      {/* obliques */}
      <Part {...common('obliques')} position={[0.19, 0.9, 0]}>
        <boxGeometry args={[0.1, 0.24, 0.22]} />
      </Part>
      <Part {...common('obliques')} position={[-0.19, 0.9, 0]}>
        <boxGeometry args={[0.1, 0.24, 0.22]} />
      </Part>

      {/* lower back */}
      <Part {...common('lowerBack')} position={[0, 0.92, -0.14]}>
        <boxGeometry args={[0.32, 0.22, 0.07]} />
      </Part>

      {/* glutes */}
      <Part {...common('glutes')} position={[0, 0.72, -0.06]}>
        <boxGeometry args={[0.42, 0.2, 0.24]} />
      </Part>

      {/* arms */}
      <Part {...common('armsL')} position={[0.37, 1.02, 0]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.075, 0.3, 8, 16]} />
      </Part>
      <Part {...common('armsR')} position={[-0.37, 1.02, 0]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.075, 0.3, 8, 16]} />
      </Part>

      {/* forearms */}
      <Part {...common('forearmL')} position={[0.43, 0.68, 0]}>
        <capsuleGeometry args={[0.058, 0.3, 8, 16]} />
      </Part>
      <Part {...common('forearmR')} position={[-0.43, 0.68, 0]}>
        <capsuleGeometry args={[0.058, 0.3, 8, 16]} />
      </Part>

      {/* thighs */}
      <Part {...common('thighL')} position={[0.14, 0.42, 0]}>
        <capsuleGeometry args={[0.105, 0.4, 8, 16]} />
      </Part>
      <Part {...common('thighR')} position={[-0.14, 0.42, 0]}>
        <capsuleGeometry args={[0.105, 0.4, 8, 16]} />
      </Part>

      {/* calves */}
      <Part {...common('calfL')} position={[0.14, 0.02, 0]}>
        <capsuleGeometry args={[0.078, 0.36, 8, 16]} />
      </Part>
      <Part {...common('calfR')} position={[-0.14, 0.02, 0]}>
        <capsuleGeometry args={[0.078, 0.36, 8, 16]} />
      </Part>
    </group>
  )
}

/**
 * Interactive, dependency-light 3D body: one stylized figure composed of primitives, shaded per
 * region. It is loaded lazily by its consumers (no SSR), so three.js never enters the server bundle
 * or the initial client payload of a page that does not show it.
 */
export default function BodyMap3D({
  values,
  colors,
  selected,
  onSelect,
  baseColor = '#7b8794',
  activeColor = '#FB9A3C',
  height = 340,
  className,
}: BodyMap3DProps) {
  const regionCount = useMemo(() => BODY_REGIONS.length, [])

  return (
    <div
      className={className}
      style={{ height }}
      role="img"
      aria-label={`مدل سه‌بعدی بدن با ${regionCount} ناحیه قابل انتخاب`}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.15, 3.1], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.95} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.15} />
        <directionalLight position={[-3, 2, -2]} intensity={0.45} />
        <Figure
          values={values}
          colors={colors}
          selected={selected}
          onSelect={onSelect}
          baseColor={baseColor}
          activeColor={activeColor}
        />
      </Canvas>
    </div>
  )
}
