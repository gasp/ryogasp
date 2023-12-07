import Thumbnail from '../../components/ui/Thumbnail'
import Preview from '../../components/ui/Preview'
import utils from '/src/styles/utils.module.css'

type Picture = {
  type: 'classic'
  thumbnailSrc: string
  src: string
  title: string
  description?: string
}

type State = {
  pictures: Array<Picture>
  selectedIndex: number
  active: boolean
}

// Initial state
export const init: State = {
  pictures: 'ABCDEFGHIJKL'.split('').map((letter) => ({
    type: 'classic',
    thumbnailSrc: '/assets/logo.png',
    src: '/assets/logo.png',
    title: letter,
    description: 'logo'
  })),
  selectedIndex: 0,
  active: false
}

// Actions
const SelectIndex = (state: State, index: number) => ({
  ...state,
  selectedIndex: index,
  active: true
})

// View
const HomePage = (state: State) => (
  <div class={utils.container}>
    <h1>Portfolio</h1>
    <div class={utils.grid}>
      {state.pictures.map((picture, index) => (
        <div class={utils.card}>
          <Thumbnail
            active={state.active && state.selectedIndex === index}
            onclick={() => SelectIndex(state, index)}
            title={picture.title}
          />
        </div>
      ))}
    </div>
    {state.active && <Preview {...state.pictures[state.selectedIndex]} />}
  </div>
)

export default HomePage
