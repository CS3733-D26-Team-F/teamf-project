import type {ReactNode} from 'react'

export function TitleComponent(): ReactNode {
    return (
        <div className="text-yale-blue">
            <h1>Core Commercial Underwriter Resources</h1>
        </div>
    )
}

export function TitleDemo() {
    return (
        <TitleComponent />
    )
}