This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Using TaskMaster

1. Configure AI models (if needed) and add API keys to `.env`                                  │
│   ├─ Models: Use `task-master models` commands                                                   │
│   └─ Keys: Add provider API keys to .env (or inside the MCP config file i.e. .cursor/mcp.json)   │
│   2. Discuss your idea with AI and ask for a PRD using example_prd.txt, and save it to           │
│   scripts/PRD.txt                                                                                │
│   3. Ask Cursor Agent (or run CLI) to parse your PRD and generate initial tasks:                 │
│   └─ MCP Tool: parse_prd | CLI: task-master parse-prd scripts/prd.txt                            │
│   4. Ask Cursor to analyze the complexity of the tasks in your PRD using research                │
│   └─ MCP Tool: analyze_project_complexity | CLI: task-master analyze-complexity                  │
│   5. Ask Cursor to expand all of your tasks using the complexity analysis                        │
│   6. Ask Cursor to begin working on the next task                                                │
│   7. Add new tasks anytime using the add-task command or MCP tool                                │
│   8. Ask Cursor to set the status of one or many tasks/subtasks at a time. Use the task id       │
│   from the task lists.                                                                           │
│   9. Ask Cursor to update all tasks from a specific task id based on new learnings or pivots     │
│   in your project.                                                                               │
│   10. Ship it! 