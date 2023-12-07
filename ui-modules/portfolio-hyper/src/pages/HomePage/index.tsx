import Input from '/src/components/ui/Input'
import utils from '/src/styles/utils.module.css'

type State = {
  a: number
  b: number
}
// Initial state
export const init: State = {
  a: 1,
  b: 2
}

// Actions
const SetA = (state: State, ev: InputEvent) => ({
  ...state,
  a: Number((ev.target as HTMLInputElement).value)
})

const SetB = (state: State, ev: InputEvent) => ({
  ...state,
  b: Number((ev.target as HTMLInputElement).value)
})

// View
const HomePage = (state: State) => (
  <div class={utils.container}>
    <h1>👋 Welcome to hyperapp</h1>
    <div class={utils.grid}>
      <Input type="number" name="a" value={state.a} onchange={SetA} />
      <Input type="number" name="b" value={state.b} onchange={SetB} />
    </div>
    <h2>
      {state.a} + {state.b} = {state.a + state.b}
    </h2>
  </div>
)

export default HomePage
