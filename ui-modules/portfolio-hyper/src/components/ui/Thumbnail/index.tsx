import styles from './thumbnail.module.css'

type Props = {
  onclick?: () => void
  title: string
  active: boolean
}
const Thumbnail = ({ onclick, title, active, ...rest }: Props) => (
  <a
    class={[styles.thumbnail, active ? styles.active : null]}
    {...rest}
    onclick={onclick}
    href={`#${title}`}
  >
    {title} {active ? 'active' : ''}
  </a>
)

export default Thumbnail
