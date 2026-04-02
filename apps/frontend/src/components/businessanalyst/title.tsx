import type {ReactNode} from 'react'

export function TitleComponent(): ReactNode {
    return (
        <div className="text-yale-blue">
            <h1>Business Analyst Resources</h1>
        </div>
    )
}

export function TitleDemo() {
    return (
        <TitleComponent />
    )
}