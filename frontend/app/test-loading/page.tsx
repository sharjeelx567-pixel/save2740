import { Suspense } from 'react'

// Simulate slow component
async function SlowComponent() {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-brand-green mb-4">Loading Test Complete!</h1>
        <p className="text-gray-600">The loading modal should have appeared for 3 seconds.</p>
    </div>
}

export default function LoadingTest() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <SlowComponent />
            </Suspense>
        </div>
    )
}
