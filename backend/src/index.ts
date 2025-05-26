// backend/src/index.ts
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001; // 后端 API 端口

app.use(cors()); // 允许来自前端的跨域请求 (开发时通常是 localhost:5173)
app.use(express.json()); // 解析 JSON 请求体

// 获取所有 Todos
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(todos);
  } catch (error) {
    console.error("Failed to fetch todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// 创建一个新的 Todo
app.post("/api/todos", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res
        .status(400)
        .json({ error: "Title is required and must be a non-empty string" });
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
});

// 更新 Todo (标记为完成/未完成)
app.put("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== "boolean") {
      return res
        .status(400)
        .json({ error: "Completed status must be a boolean" });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: parseInt(id) },
      data: { completed },
    });
    res.json(updatedTodo);
  } catch (error) {
    // Prisma 会在找不到记录时抛出 P2025 错误
    if ((error as any).code === "P2025") {
      return res.status(404).json({ error: "Todo not found" });
    }
    console.error("Failed to update todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// 删除 Todo
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.todo.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No Content
  } catch (error) {
    if ((error as any).code === "P2025") {
      return res.status(404).json({ error: "Todo not found" });
    }
    console.error("Failed to delete todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend server listening on http://localhost:${port}`);
});
