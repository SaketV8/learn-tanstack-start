import { type FormEvent, useRef, useState } from 'react'
// import { FormEvent, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSwap } from '@/components/loading-swap'
import { PlusIcon } from 'lucide-react'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import z from 'zod'
import { db } from '@/db'
import { todos } from '@/db/schema'
import { redirect } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

const addTodo = createServerFn({ method: 'POST' })
    .validator(z.object({ title: z.string().min(1) }))
    .handler(async ({ data }) => {
        await db.insert(todos).values({ ...data, isComplete: false })
        throw redirect({ to: "/" })
    })

const updateTodo = createServerFn({ method: 'POST' })
    .validator(z.object({ id: z.string().min(1), title: z.string().min(1) }))
    .handler(async ({ data }) => {
        await db.update(todos).set(data).where(eq(todos.id, data.id))

        throw redirect({ to: '/' })
    })

export function TodoForm({
    todo,
}: {
    todo?: {
        id: string
        title: string
    }
}) {
    const titleRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)

    const addTodoFn = useServerFn(addTodo)
    const updateTodoFn = useServerFn(updateTodo)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        const title = titleRef.current?.value
        if (!title) return

        setIsLoading(true)
        if (todo == null) {

            // this does not work when calling from client side
            // await addTodo({ data: { title } })

            // use useServerFn
            await addTodoFn({ data: { title } })
        } else {
            // this does not work when calling from client side
            // await updateTodo({ data: { id: todo.id, title } })

            // use useServerFn
            await updateTodoFn({ data: { id: todo.id, title } })
        }
        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                autoFocus
                ref={titleRef}
                placeholder="Enter your todo..."
                className="flex-1"
                aria-label="Name"
                defaultValue={todo?.title}
            />
            <Button type="submit" disabled={isLoading}>
                <LoadingSwap isLoading={isLoading} className="flex gap-2 items-center">
                    {todo == null ? (
                        <>
                            <PlusIcon /> Add
                        </>
                    ) : (
                        'Update'
                    )}
                </LoadingSwap>
            </Button>
        </form>
    )
}