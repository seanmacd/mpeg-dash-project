# DASH project

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

or

```bash
bun run start
```

## Uploading a file

Run this cURL request from the directory with your file. Update the filename header with the file's name, or whatever you want the resulting stream to be saved as.

```bash
curl -X POST http://localhost:3000/upload -H "Content-Type: video/mp4" -H "X-Filename: filename.mp4" --data-binary "@filename.mp4"
```
