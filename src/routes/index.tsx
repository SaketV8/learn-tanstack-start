import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Checkbox } from '@/components/ui/checkbox'

import { ActionButton } from '@/components/action-button'

import { db } from '@/db';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { EditIcon, ListTodoIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils';
import { startTransition, useState } from 'react';
import { todos } from '@/db/schema';
import z from 'zod';
import { eq } from 'drizzle-orm';


const serverFn = createServerFn({ method: "GET" })
  .handler(() => {
    return db.query.todos.findMany();
  })

export const Route = createFileRoute('/')({
  component: Home,

  loader: () => {
    // console.log("loading data...")
    // return { name: "data from loader" };

    // runs on both client and server
    // return db.query.todos.findMany()

    // runs on both client and server, but actual func run on server
    return serverFn();
  }
})

function Home() {
  // const data = Route.useLoaderData();
  const todos = Route.useLoaderData();

  const completedCount = todos.filter((todo) => todo.isComplete).length
  const totalCount = todos.length

  return (
    <div className='min-h-screen container space-y-8'>
      {/* header section */}
      <div className='flex justify-between items-center gap-4'>
        <div className='space-y-2'>
          <h1 className='text-4xl font-bold'> Todo List</h1>

          {
            totalCount > 0 && (
              <Badge variant={'outline'}>
                {completedCount} of {totalCount} completed
              </Badge>
            )
          }
        </div>

        <div>
          <Button size={"sm"} asChild>
            <Link
              to="/todos/new"
            > <PlusIcon /> Add Todo </Link>
          </Button>
        </div>
      </div>

      {/* content - todolist */}
      <TodoListTable todos={todos} />

    </div>
  )
}

function TodoListTable({
  todos,
}: {
  todos: Array<{
    id: string
    title: string
    isComplete: boolean
    createdAt: Date
  }>
}) {

  if (todos.length == 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTodoIcon />
          </EmptyMedia>
          <EmptyTitle>No Todos</EmptyTitle>
          <EmptyDescription>Try adding a new todo</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/todos/new">
              <PlusIcon /> Add Todo
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead></TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Created On</TableHead>
          <TableHead className="w-0"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {todos.map((todo) => (
          <TodoTableRow key={todo.id} {...todo} />
        ))}
      </TableBody>
    </Table>
  );
}


const deleteFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await db.delete(todos).where(eq(todos.id, data.id))

    return { error: false }
  })

const toggleFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().min(1),
      isComplete: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await new Promise((res) => setTimeout(res, 1000))
    await db
      .update(todos)
      .set({ isComplete: data.isComplete })
      .where(eq(todos.id, data.id))
  })

function TodoTableRow({
  createdAt,
  id,
  isComplete,
  title,
}: {
  id: string
  title: string
  isComplete: boolean
  createdAt: Date
}) {
  const deleteFnServer = useServerFn(deleteFn)
  const toggleFnServer = useServerFn(toggleFn)

  const [isCurrentComplete, setIsCurrentComplete] = useState(isComplete)
  const router = useRouter()

  return (
    <TableRow
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('[data-actions]')) return

        setIsCurrentComplete((c) => !c)
        startTransition(async () => {
          await toggleFnServer({ data: { id, isComplete: !isCurrentComplete } })
          router.invalidate()
        })
      }}
    >
      <TableCell>
        <Checkbox checked={isCurrentComplete} />
      </TableCell>
      <TableCell
        className={cn(
          'font-medium',
          isCurrentComplete && 'text-muted-foreground line-through',
        )}
      >
        {title}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(createdAt)}
      </TableCell>
      <TableCell data-actions>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to="/todos/$id/edit" params={{ id }}>
              <EditIcon />
            </Link>
          </Button>
          <ActionButton
            action={async () => {
              const res = await deleteFnServer({ data: { id } })
              router.invalidate()
              return res
            }}
            variant="destructive"
            size="icon-sm"
          >
            <Trash2Icon />
          </ActionButton>
        </div>
      </TableCell>
    </TableRow>
  )
}

function formatDate(date: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
  })

  return formatter.format(date)
}