import styles from './preview.module.css'

type Props = {
  onclick?: () => void
  title: string
}
const Preview = ({ onclick, title, ...rest }: Props) => (
  <div class={styles.preview} {...rest} onclick={onclick} href={`#${title}`}>
    <div class={[styles.current, styles.picture]}>{title}</div>
  </div>
)

export default Preview
