import { db } from '#/db';
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start';


const serverFn = createServerFn({method: "GET"})
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

  return (
    <>
      <h1>Hi</h1>
      <h2>Total todos: {todos.length}</h2>
    </>
  )
}
