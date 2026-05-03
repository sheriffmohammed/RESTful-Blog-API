import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [
        react(),
        {
            name: "local-image-upload",
            configureServer(server) {
                server.middlewares.use("/__uploads", async (req, res, next) => {
                    if (req.method !== "POST") {
                        next();
                        return;
                    }
                    try {
                        const request = new Request(`http://${req.headers.host ?? "127.0.0.1:5173"}${req.url}`, {
                            method: req.method,
                            headers: req.headers,
                            body: req,
                            duplex: "half",
                        });
                        const formData = await request.formData();
                        const file = formData.get("file");
                        const rawFolder = String(formData.get("folder") ?? "misc");
                        const folder = rawFolder === "avatars" || rawFolder === "posts" ? rawFolder : "misc";
                        if (!(file instanceof File)) {
                            res.statusCode = 400;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({ detail: "No file was uploaded." }));
                            return;
                        }
                        const extension = path.extname(file.name) || ".bin";
                        const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
                        const filename = `${randomUUID()}${extension}`;
                        const destination = path.join(uploadDir, filename);
                        await mkdir(uploadDir, { recursive: true });
                        await writeFile(destination, Buffer.from(await file.arrayBuffer()));
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({ path: `/uploads/${folder}/${filename}` }));
                    }
                    catch (error) {
                        res.statusCode = 500;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({
                            detail: error instanceof Error ? error.message : "Upload failed.",
                        }));
                    }
                });
            },
        },
    ],
    server: {
        host: "127.0.0.1",
        port: 5173,
        proxy: {
            "/edit-user-data/": "http://127.0.0.1:8000",
            "/posts/": "http://127.0.0.1:8000",
            "/user-posts/": "http://127.0.0.1:8000",
            "/get-post/": "http://127.0.0.1:8000",
            "/comments/": "http://127.0.0.1:8000",
            "/users-who-liked-post/": "http://127.0.0.1:8000",
            "/users-who-liked-comment/": "http://127.0.0.1:8000",
            "/me/": "http://127.0.0.1:8000",
            "/login": "http://127.0.0.1:8000",
            "/register/": "http://127.0.0.1:8000",
            "/post/": "http://127.0.0.1:8000",
            "/comment/": "http://127.0.0.1:8000",
            "/like-post/": "http://127.0.0.1:8000",
            "/like-comment/": "http://127.0.0.1:8000",
            "/delete-post/": "http://127.0.0.1:8000",
            "/delete-comment/": "http://127.0.0.1:8000",
            "/delete-like-post/": "http://127.0.0.1:8000",
            "/delete-like-comment/": "http://127.0.0.1:8000",
            "/edit-comment/": "http://127.0.0.1:8000",
            "/update-post/": "http://127.0.0.1:8000",
        },
    },
});
