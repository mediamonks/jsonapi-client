export type TagName = keyof IntrinsicElementPropsMap
export type ViewType = TagName | FunctionComponent<any, any>

export type FormElementProps = BaseHTMLElementProps & {
  onSubmit?: (event: Event) => void
}

export type ButtonElementProps = BaseHTMLElementProps & {
  type?: 'button' | 'submit'
  disabled?: boolean
}

export type LabelElementProps = BaseHTMLElementProps & {
  for?: string
}

type BaseSelfClosingElementProps = Omit<BaseHTMLElementProps, 'children'> & {
  children?: never
}

type BaseInputElementProps = BaseHTMLElementProps & {
  value: string
  name: string
  readonly?: boolean
}

type BaseInputElementPropsOfType<T extends string> = BaseInputElementProps & {
  type?: T
}

type TextLikeInputElementType = 'text' | 'search'

export type TextInputElementProps = BaseInputElementPropsOfType<TextLikeInputElementType> & {
  placeholder?: string
  onInput?: (event: InputEvent) => void
}

export type InputElementProps = TextInputElementProps

export type IntrinsicElementPropsMap = {
  div: BaseHTMLElementProps
  form: FormElementProps
  input: InputElementProps
  button: ButtonElementProps
  label: LabelElementProps
  br: BaseSelfClosingElementProps
  hr: BaseSelfClosingElementProps
}

export type ViewChildren = ReadonlyArray<ViewChild>

export type PropsWithChildren<T extends Props> = T & {
  children?: ViewChildren
}

export type PropsOfViewType<T extends ViewType> = T extends TagName
  ? IntrinsicElementPropsMap[T]
  : T extends FunctionComponent<infer R, any>
  ? R
  : never

export type BaseHTMLElementProps = PropsWithChildren<{
  id?: string
  key?: string
  ref?: RefProp<HTMLElement | null>
  className?: string
  style?: Record<string, string>
  onClick?: (event: MouseEvent) => void
}>

export type Props = Record<string, unknown>

export class ViewElement<T extends ViewType, U extends PropsOfViewType<T>> {
  readonly type: T
  props: U

  constructor(type: T, props: U, children: U['children']) {
    this.type = type
    this.props = props

    if (!props.children && children) {
      props.children = children
    }
  }
}

export type ViewChild =
  | ReadonlyArray<ViewElement<any, { key?: string }>>
  | ViewElement<any, any>
  | null
  | string
  | number
  | false

export type FunctionComponent<T extends Props | null, U extends ViewElement<ViewType, Props>> = (
  props: T,
) => U

const renderChild = (child: unknown): Text | HTMLElement | DocumentFragment | Comment => {
  if (Array.isArray(child)) {
    const fragment = document.createDocumentFragment()
    child.forEach((item) => {
      fragment.appendChild(renderChild(item))
    })
    return fragment
  }

  if (typeof child === 'string' || typeof child === 'number') {
    return document.createTextNode(child as string)
  }

  if (child instanceof ViewElement) {
    return renderElement(child)
  }

  return new Comment()
}

const renderElement = (element: ViewElement<ViewType, Props>) => {
  if (typeof element.type === 'function') {
    return renderChild(element.type(element.props))
  }

  if (typeof element.type === 'string') {
    const node = document.createElement(element.type)

    Object.entries(element.props as Props).forEach(([name, value]) => {
      if (/^on[A-Z]/.test(name)) {
        ;(node as any)[name.toLowerCase()] = value
      } else {
        switch (name) {
          case 'ref':
            typeof value === 'function' ? value(node) : ((value as any).current = node)
            break
          case 'children':
            ;(value as Array<unknown>).forEach((child) => {
              node.appendChild(renderChild(child))
            })
            break
          default:
            node.setAttribute(name, value as string)
        }
      }
    })

    return node
  }

  throw new TypeError(`Invalid element type`)
}

type ElementChildren<T extends ViewType, U extends PropsOfViewType<T>> = 'children' extends keyof U
  ? U['children']
  : PropsOfViewType<T>['children']

export const createElement = <T extends ViewType, U extends PropsOfViewType<T>>(
  type: T,
  props: U,
  children?: ElementChildren<T, U>,
): ViewElement<T, U> => new ViewElement(type, props, children)

export const render = (element: ViewElement<any, any>, rootElement: HTMLElement): void => {
  rootElement.innerHTML = ''
  const child = renderElement(element)
  if (child) {
    rootElement.appendChild(child)
  }
}

type RefProp<T> = Ref<T> | ((value: T) => void)

export interface Ref<T> {
  current: T
}

export const useRef = <T>(initialValue: T): Ref<T> => ({
  current: initialValue,
})
