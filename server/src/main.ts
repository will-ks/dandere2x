/* eslint-disable unicorn/no-process-exit */
import express from 'express'

const addGlobalExitHandler = (
    callback: (eventOrExitCodeOrError?: number | string | Error) => void
) => {
    let exiting = false
    ;[
        'beforeExit',
        'uncaughtException',
        'unhandledRejection',
        'SIGHUP',
        'SIGINT',
        'SIGQUIT',
        'SIGILL',
        'SIGTRAP',
        'SIGABRT',
        'SIGBUS',
        'SIGFPE',
        'SIGUSR1',
        'SIGSEGV',
        'SIGUSR2',
        'SIGTERM',
    ].forEach((event) =>
        process.on(event, (eventOrExitCodeOrError?: number | string | Error) => {
            if (exiting) {
                return
            }
            exiting = true
            callback(eventOrExitCodeOrError)
        })
    )
}
const onExitCallbacks: (() => Promise<void>)[] = []
const exit = async (exitCode?: number) => {
    console.log('Cleaning up, please wait...')
    await Promise.allSettled(
        onExitCallbacks.map(async (callback) => {
            try {
                await callback()
            } catch (error) {
                console.error(error)
            }
        })
    )
    process.exit(exitCode)
}
addGlobalExitHandler((eventOrExitCodeOrError) => {
    console.log(
        eventOrExitCodeOrError instanceof Error
            ? `Exiting due to error: ${eventOrExitCodeOrError}`
            : 'Exiting...'
    )
    exit(
        typeof eventOrExitCodeOrError === 'number' &&
        !Number.isNaN(eventOrExitCodeOrError)
            ? eventOrExitCodeOrError
            : undefined
    ).catch((error) => console.error(error))
})

const app = express()

    const PORT = 3001

;(async () => {
    app.get('/', (_req, res) => {
        res.send('Hello World!')
    })
    app.get('/healthcheck', (_req, res) => {
        res.send('Good')
    })
    app.get('/status', (_req, res) => {
        res.send('Good')
    })
    onExitCallbacks.push(async () => {
        // Cleanup function
        console.log('Shutting down')
    })
    app.post('/start', (_req, res) => {
        res.send('Started')
    })
    app.listen(PORT)
})()

console.log(`Server started on port ${PORT}`)
