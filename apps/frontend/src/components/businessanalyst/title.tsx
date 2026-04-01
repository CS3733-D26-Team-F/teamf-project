import type {ReactNode} from 'react'

export function TitleComponent(): ReactNode {
    return (
        <div>
            <h1>Business Analyst Resources</h1>
        </div>
    )
}

export function TitleDemo() {
    return (
        <TitleComponent />
    )
}