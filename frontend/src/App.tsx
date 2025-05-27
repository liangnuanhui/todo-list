// frontend/src/App.tsx
import { useEffect, useState, type FormEvent } from "react";
import "./App.css"; // 你可以添加一些基础样式

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"; // 后端 API 地址

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取 Todos
  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/todos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTodos(data);
    } catch (e) {
      console.error("Failed to fetch todos:", e);
      setError(e instanceof Error ? e.message : "Failed to load todos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 添加 Todo
  const handleAddTodo = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) {
      setError("请输入待办事项内容");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTodoTitle }),
      });
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {
          /* empty */
        }
        throw new Error(errMsg);
      }
      setNewTodoTitle("");
      await fetchTodos(); // 保证和后端一致
    } catch (e) {
      console.error("Failed to add todo:", e);
      setError(e instanceof Error ? e.message : "Failed to add todo");
    } finally {
      setIsLoading(false);
    }
  };

  // 切换 Todo 状态
  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || `HTTP error! status: ${response.status}`
        );
      }
      const updatedTodo = await response.json();
      setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
    } catch (e) {
      console.error("Failed to toggle todo:", e);
      setError(e instanceof Error ? e.message : "Failed to toggle todo");
    }
  };

  // 删除 Todo
  const handleDeleteTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const errData = await response.json();
        throw new Error(
          errData.error || `HTTP error! status: ${response.status}`
        );
      }
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (e) {
      console.error("Failed to delete todo:", e);
      setError(e instanceof Error ? e.message : "Failed to delete todo");
    }
  };

  if (isLoading) return <p>Loading todos...</p>;

  return (
    <div className="App">
      <h1>To-Do List</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <form onSubmit={handleAddTodo}>
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="Add a new todo"
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              textDecoration: todo.completed ? "line-through" : "none",
              cursor: "pointer",
            }}
          >
            <span onClick={() => toggleTodo(todo.id, todo.completed)}>
              {todo.title}
            </span>
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              style={{ marginLeft: "10px", cursor: "pointer" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
