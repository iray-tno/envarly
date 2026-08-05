import { Config } from "@remotion/cli/config";
import path from "node:path";

// Entry point lives at remotion/index.jsx; without this, Remotion's public-dir
// autodetection anchors to this file's directory (media/) instead of
// remotion/, and serves remotion/public/* under a /public/ URL prefix instead
// of at the root, breaking every staticFile() call. (Config files are loaded
// in a context where import.meta.url isn't available, so use process.cwd()
// — remotion commands are always run from media/.)
Config.setPublicDir(path.join(process.cwd(), "remotion", "public"));
