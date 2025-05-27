// backend/src/index.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 获取所有 Todos
app.get(
  "/api/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const todos = await prisma.todo.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(todos);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
      // next(error); // 可选：传递给 Express 错误处理中间件
    }
  }
);

// 创建一个新的 Todo
app.post(
  "/api/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title } = req.body;
      if (!title || typeof title !== "string" || title.trim() === "") {
        res
          .status(400)
          .json({ error: "Title is required and must be a non-empty string" });
        return; // 在发送响应后明确返回
      }
      const newTodo = await prisma.todo.create({
        data: {
          title: title.trim(),
        },
      });
      res.status(201).json(newTodo);
    } catch (error) {
      console.error("Failed to create todo:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  }
);

// 更新 Todo (标记为完成/未完成)
// 注意：这里的 req.params 类型可以更精确，如果你的路由参数是数字ID
app.put(
  "/api/todos/:id",
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { completed } = req.body;

      if (typeof completed !== "boolean") {
        res.status(400).json({ error: "Completed status must be a boolean" });
        return; // 在发送响应后明确返回
      }

      const updatedTodo = await prisma.todo.update({
        where: { id: parseInt(id) }, // 确保 id 是数字
        data: { completed },
      });
      res.json(updatedTodo);
    } catch (error) {
      if ((error as any).code === "P2025") {
        // Prisma 的记录未找到错误
        res.status(404).json({ error: "Todo not found" });
        return; // 在发送响应后明确返回
      }
      console.error("Failed to update todo:", error);
      res.status(500).json({ error: "Failed to update todo" });
    }
  }
);

// 删除 Todo
app.delete(
  "/api/todos/:id",
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.todo.delete({
        where: { id: parseInt(id) }, // 确保 id 是数字
      });
      res.status(204).send();
    } catch (error) {
      if ((error as any).code === "P2025") {
        res.status(404).json({ error: "Todo not found" });
        return; // 在发送响应后明确返回
      }
      console.error("Failed to delete todo:", error);
      res.status(500).json({ error: "Failed to delete todo" });
    }
  }
);

app.listen(port, () => {
  console.log(`🚀 Backend server listening on http://localhost:${port}`);
});
