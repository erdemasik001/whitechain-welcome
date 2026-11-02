import { useRef, type PointerEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useI18n } from '../i18n'
import { loadMetadata, resolveUri } from '../lib/metadata'

type Props = {
  /** Token URI from the contract. Undefined while loading or when no contract is configured. */
  tokenUri?: string
  owned: boolean
  /** The badge number: the one this wallet holds, or the next one to be minted. */
  number?: bigint
}

/** Sample slab drawn by design/slab.mjs; shown until the contract's own image has loaded. */
const PREVIEW_IMAGE = `${import.meta.env.BASE_URL}badge-preview.svg`

/** The badge: the slab image from the contract, tilting in 3D under the pointer. */
export function BadgeCard({ tokenUri, owned, number }: Props) {
  const { t } = useI18n()
  const metadata = useQuery({
    queryKey: ['badge-metadata', tokenUri],
    queryFn: () => loadMetadata(tokenUri!),
    enabled: !!tokenUri,
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  })

  const image = metadata.data?.image
  const name = metadata.data?.name ?? 'Welcome to Whitechain'

  // The tilt only sets CSS variables, so moving the pointer never re-renders React.
  const slab = useRef<HTMLDivElement>(null)
  function tilt(event: PointerEvent<HTMLDivElement>) {
    const el = slab.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    el.style.setProperty('--tilt-x', `${(0.5 - y) * 14}deg`)
    el.style.setProperty('--tilt-y', `${(x - 0.5) * 14}deg`)
    el.style.setProperty('--shine-x', `${x * 100}%`)
    el.style.setProperty('--shine-y', `${y * 100}%`)
  }
  function reset() {
    slab.current?.style.removeProperty('--tilt-x')
    slab.current?.style.removeProperty('--tilt-y')
  }

  return (
    <figure className={`nft ${owned ? 'nft--owned' : ''}`}>
      <div className="nft-stage" onPointerMove={tilt} onPointerLeave={reset}>
        <div className="nft-slab" ref={slab}>
          <img src={image ? resolveUri(image) : PREVIEW_IMAGE} alt={name} />
          <span className="nft-holo" aria-hidden="true" />
          <span className="nft-shine" aria-hidden="true" />
        </div>
      </div>
      <dl className="nft-stats">
        <div>
          <dt>{t('badgeNumber')}</dt>
          <dd>#{number?.toString() ?? '…'}</dd>
        </div>
        <div>
          <dt>{t('badgeStatus')}</dt>
          <dd>{owned ? t('yours') : t('preview')}</dd>
        </div>
      </dl>
      <figcaption>{t('badgeCaption')}</figcaption>
      <SlabClipPath />
    </figure>
  )
}

/**
 * The outline of the acrylic case inside the 1000 × 1400 badge image (front face plus the side
 * edge drawn 16 px down-right), in 0–1 units so it scales with the image. Clipping to it hides
 * the image's own background, so the case sits directly on the page.
 */
function SlabClipPath() {
  return (
    <svg className="nft-clip" width="0" height="0" aria-hidden="true">
      <clipPath id="slab-clip" clipPathUnits="objectBoundingBox">
        <rect x="0.12" y="0.0286" width="0.76" height="0.9429" rx="0.056" ry="0.04" />
        <rect x="0.136" y="0.04" width="0.76" height="0.9429" rx="0.056" ry="0.04" />
      </clipPath>
    </svg>
  )
}
