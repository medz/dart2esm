part of 'runtime_helpers.dart';

extension _IoHelperDeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _ioHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.io => EsmRawModuleItem(r'''
const __dartIoEnumCache = new Map();
function __dartIoEnum(typeName, name, index) {
  const key = typeName + ":" + name + ":" + index;
  if (__dartIoEnumCache.has(key)) return __dartIoEnumCache.get(key);
  const value = {
    __dartType: typeName,
    name,
    index,
    get _mode() { return index; },
    get _type() { return index; },
    "=="(other) { return other != null && other.__dartType === typeName && other.index === index; },
    toString() {
      if (typeName === "FileSystemEntityType") return name;
      if (typeName === "ProcessStartMode") return name;
      if (typeName === "ProcessSignal") return name;
      return typeName + "." + name;
    },
  };
  Object.freeze(value);
  __dartIoEnumCache.set(key, value);
  return value;
}
function __dartIoOSError(message = "", errorCode = -1) {
  return Object.freeze({
    __dartType: "OSError",
    message: String(message ?? ""),
    errorCode: Number(errorCode ?? -1),
    toString() {
      if (this.message.length > 0) {
        return this.errorCode === -1 ? "OS Error: " + this.message : "OS Error: " + this.message + ", errno = " + this.errorCode;
      }
      return this.errorCode === -1 ? "OS Error" : "OS Error: errno = " + this.errorCode;
    },
  });
}
function __dartIoFileSystemException(message = "", path = "", osError = null) {
  const error = new Error(String(message ?? ""));
  error.name = "FileSystemException";
  Object.defineProperty(error, "__dartType", { value: "FileSystemException" });
  Object.defineProperty(error, "__dartIoFileSystemException", { value: true });
  Object.defineProperty(error, "__dartCoreErrorType", { value: "FileSystemException" });
  Object.defineProperty(error, "path", { value: path, enumerable: true });
  Object.defineProperty(error, "osError", { value: osError, enumerable: true });
  error.toString = function () {
    const text = String(this.message ?? "");
    const pathText = this.path == null ? "" : ", path = '" + String(this.path) + "'";
    const osText = this.osError == null ? "" : " (" + String(this.osError) + ")";
    if (text.length > 0) return "FileSystemException: " + text + pathText + osText;
    if (this.osError != null) return "FileSystemException: " + String(this.osError) + pathText;
    if (this.path != null) return "FileSystemException: " + String(this.path);
    return "FileSystemException";
  };
  return error;
}
function __dartProcessResult(pid, exitCode, stdout, stderr) {
  return Object.freeze({
    __dartType: "ProcessResult",
    pid: Number(pid ?? 0),
    exitCode: Number(exitCode ?? 0),
    stdout,
    stderr,
  });
}
function __dartIoPlatform(name) {
  const process = globalThis.process;
  const platform = process?.platform;
  const operatingSystem = platform === "win32" ? "windows" : platform === "darwin" ? "macos" : platform === "linux" ? "linux" : platform === "android" ? "android" : "browser";
  switch (name) {
    case "numberOfProcessors":
      return Number(globalThis.navigator?.hardwareConcurrency ?? 1);
    case "pathSeparator":
      return operatingSystem === "windows" ? "\\" : "/";
    case "operatingSystem":
      return operatingSystem;
    case "operatingSystemVersion":
      return String(process?.version ?? "");
    case "localHostname":
      return String(process?.env?.HOSTNAME ?? "");
    case "version":
      return "dart2esm";
    case "localeName":
      return String(process?.env?.LANG ?? globalThis.navigator?.language ?? "");
    case "isLinux":
      return operatingSystem === "linux";
    case "isMacOS":
      return operatingSystem === "macos";
    case "isWindows":
      return operatingSystem === "windows";
    case "isAndroid":
      return operatingSystem === "android";
    case "isIOS":
      return operatingSystem === "ios";
    case "isFuchsia":
      return operatingSystem === "fuchsia";
    case "environment":
      return Object.freeze(new Map(Object.entries(process?.env ?? {})));
    case "executable":
    case "resolvedExecutable":
      return String(process?.execPath ?? "");
    case "executableArguments":
      return Array.from(process?.execArgv ?? []);
    case "packageConfig":
      return null;
    case "lineTerminator":
      return operatingSystem === "windows" ? "\r\n" : "\n";
    default:
      return null;
  }
}
'''),
      EsmRuntimeHelper.ioNode => EsmRawModuleItem(r'''
const __dartNodeFs = await import("node:fs");
const __dartNodeFsPromises = await import("node:fs/promises");
const __dartNodePath = await import("node:path");
const __dartNodeOs = await import("node:os");
const __dartNodeChildProcess = await import("node:child_process");

function __dartIoToArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (ArrayBuffer.isView(value)) return Array.from(value);
  return Array.from(value);
}
function __dartIoEncodeBytes(value, encoding = null) {
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (Array.isArray(value)) return Buffer.from(value);
  const name = String(encoding?.name ?? encoding?.__dartEncodingName ?? "utf8").replace("-", "");
  return Buffer.from(String(value), name === "latin1" ? "latin1" : name === "ascii" ? "ascii" : "utf8");
}
function __dartIoDecodeBytes(value, encoding = null) {
  const name = String(encoding?.name ?? encoding?.__dartEncodingName ?? "utf8").replace("-", "");
  return Buffer.from(value).toString(name === "latin1" ? "latin1" : name === "ascii" ? "ascii" : "utf8");
}
function __dartIoNodeError(error, message, path = "") {
  if (error?.__dartIoFileSystemException === true) throw error;
  const code = typeof error?.errno === "number" ? error.errno : -1;
  throw __dartIoFileSystemException(message, path, __dartIoOSError(error?.message ?? String(error), code));
}
function __dartIoModeFlag(mode, fallback = "w") {
  const index = Number(mode?._mode ?? mode?.index ?? mode ?? 1);
  switch (index) {
    case 0:
      return "r";
    case 1:
      return "w+";
    case 2:
      return "a+";
    case 3:
      return "w";
    case 4:
      return "a";
    default:
      return fallback;
  }
}
function __dartFileSystemEntityType(path, followLinks = true) {
  try {
    const stat = followLinks ? __dartNodeFs.statSync(String(path)) : __dartNodeFs.lstatSync(String(path));
    if (stat.isFile()) return __dartIoEnum("FileSystemEntityType", "file", 0);
    if (stat.isDirectory()) return __dartIoEnum("FileSystemEntityType", "directory", 1);
    if (stat.isSymbolicLink()) return __dartIoEnum("FileSystemEntityType", "link", 2);
    if (stat.isSocket()) return __dartIoEnum("FileSystemEntityType", "unixDomainSock", 3);
    if (stat.isFIFO()) return __dartIoEnum("FileSystemEntityType", "pipe", 4);
    return __dartIoEnum("FileSystemEntityType", "notFound", 5);
  } catch (_) {
    return __dartIoEnum("FileSystemEntityType", "notFound", 5);
  }
}
function __dartFileStat(path) {
  try {
    const stat = __dartNodeFs.statSync(String(path));
    const modifiedMicros = Math.trunc(stat.mtimeMs * 1000);
    return Object.freeze({
      __dartType: "FileStat",
      type: __dartFileSystemEntityType(path),
      changed: __dartDateTimeFromMicros(Math.trunc(stat.ctimeMs * 1000), false),
      modified: __dartDateTimeFromMicros(modifiedMicros, false),
      accessed: __dartDateTimeFromMicros(Math.trunc(stat.atimeMs * 1000), false),
      mode: stat.mode,
      size: stat.size,
      toString() { return "FileStat: type " + this.type + ", size " + this.size; },
    });
  } catch (_) {
    const epoch = __dartDateTimeFromMicros(0, true);
    return Object.freeze({
      __dartType: "FileStat",
      type: __dartIoEnum("FileSystemEntityType", "notFound", 5),
      changed: epoch,
      modified: epoch,
      accessed: epoch,
      mode: 0,
      size: -1,
    });
  }
}
function __dartEntityPath(value) {
  return String(value?.path ?? value);
}
function __dartFile(path) {
  path = String(path);
  const file = {
    __dartType: "File",
    get path() { return path; },
    get uri() { return __dartUriFile(path, globalThis.process?.platform === "win32", false); },
    get absolute() { return __dartFile(__dartNodePath.resolve(path)); },
    get parent() { return __dartDirectory(__dartNodePath.dirname(path)); },
    existsSync() {
      try { return __dartNodeFs.statSync(path).isFile(); } catch (_) { return false; }
    },
    exists() { return Promise.resolve(this.existsSync()); },
    createSync(options = {}) {
      try {
        if (options.recursive === true) __dartNodeFs.mkdirSync(__dartNodePath.dirname(path), { recursive: true });
        const fd = __dartNodeFs.openSync(path, options.exclusive === true ? "wx" : "a");
        __dartNodeFs.closeSync(fd);
        return null;
      } catch (error) {
        __dartIoNodeError(error, "Cannot create file", path);
      }
    },
    async create(options = {}) { this.createSync(options); return file; },
    deleteSync(options = {}) {
      try { __dartNodeFs.rmSync(path, { force: false, recursive: options.recursive === true }); return null; } catch (error) { __dartIoNodeError(error, "Cannot delete file", path); }
    },
    async delete(options = {}) { this.deleteSync(options); return file; },
    renameSync(newPath) {
      try { __dartNodeFs.renameSync(path, String(newPath)); return __dartFile(newPath); } catch (error) { __dartIoNodeError(error, "Cannot rename file", path); }
    },
    async rename(newPath) { return this.renameSync(newPath); },
    copySync(newPath) {
      try { __dartNodeFs.copyFileSync(path, String(newPath)); return __dartFile(newPath); } catch (error) { __dartIoNodeError(error, "Cannot copy file", path); }
    },
    async copy(newPath) { return this.copySync(newPath); },
    lengthSync() {
      try { return __dartNodeFs.statSync(path).size; } catch (error) { __dartIoNodeError(error, "Cannot retrieve length of file", path); }
    },
    async length() { return this.lengthSync(); },
    lastModifiedSync() {
      try { return __dartDateTimeFromMicros(Math.trunc(__dartNodeFs.statSync(path).mtimeMs * 1000), false); } catch (error) { __dartIoNodeError(error, "Cannot retrieve modification time", path); }
    },
    async lastModified() { return this.lastModifiedSync(); },
    statSync() { return __dartFileStat(path); },
    async stat() { return this.statSync(); },
    readAsBytesSync() {
      try { return Array.from(__dartNodeFs.readFileSync(path)); } catch (error) { __dartIoNodeError(error, "Cannot open file", path); }
    },
    async readAsBytes() { return Array.from(await __dartNodeFsPromises.readFile(path)); },
    readAsStringSync(options = {}) {
      try { return __dartIoDecodeBytes(__dartNodeFs.readFileSync(path), options.encoding); } catch (error) { __dartIoNodeError(error, "Cannot open file", path); }
    },
    async readAsString(options = {}) { return __dartIoDecodeBytes(await __dartNodeFsPromises.readFile(path), options.encoding); },
    readAsLinesSync(options = {}) { return this.readAsStringSync(options).split(/\r?\n/).filter((line, index, lines) => index < lines.length - 1 || line.length > 0); },
    async readAsLines(options = {}) { return this.readAsLinesSync(options); },
    writeAsBytesSync(bytes, options = {}) {
      try { __dartNodeFs.writeFileSync(path, Buffer.from(__dartIoToArray(bytes)), { flag: __dartIoModeFlag(options.mode, "w") }); if (options.flush === true) { const fd = __dartNodeFs.openSync(path, "r"); __dartNodeFs.fsyncSync(fd); __dartNodeFs.closeSync(fd); } return null; } catch (error) { __dartIoNodeError(error, "Cannot write file", path); }
    },
    async writeAsBytes(bytes, options = {}) { this.writeAsBytesSync(bytes, options); return file; },
    writeAsStringSync(contents, options = {}) {
      try { __dartNodeFs.writeFileSync(path, __dartIoEncodeBytes(contents, options.encoding), { flag: __dartIoModeFlag(options.mode, "w") }); return null; } catch (error) { __dartIoNodeError(error, "Cannot write file", path); }
    },
    async writeAsString(contents, options = {}) { this.writeAsStringSync(contents, options); return file; },
    openSync(options = {}) {
      try { return __dartRandomAccessFile(path, options.mode); } catch (error) { __dartIoNodeError(error, "Cannot open file", path); }
    },
    async open(options = {}) { return this.openSync(options); },
    openWrite(options = {}) { return __dartFileSink(path, options.mode, options.encoding); },
    resolveSymbolicLinksSync() {
      try { return __dartNodeFs.realpathSync(path); } catch (error) { __dartIoNodeError(error, "Cannot resolve symbolic links", path); }
    },
    async resolveSymbolicLinks() { return this.resolveSymbolicLinksSync(); },
    toString() { return "File: '" + path + "'"; },
  };
  return Object.freeze(file);
}
function __dartRandomAccessFile(path, mode = null) {
  path = String(path);
  const fd = __dartNodeFs.openSync(path, __dartIoModeFlag(mode, "r"));
  let closed = false;
  let position = (__dartIoModeFlag(mode, "r") === "a" || __dartIoModeFlag(mode, "r") === "a+") ? __dartNodeFs.statSync(path).size : 0;
  const ensureOpen = () => {
    if (closed) throw __dartIoFileSystemException("File closed", path, null);
  };
  const file = {
    __dartType: "RandomAccessFile",
    get path() { return path; },
    closeSync() { if (!closed) { __dartNodeFs.closeSync(fd); closed = true; } return null; },
    async close() { this.closeSync(); return null; },
    readByteSync() {
      ensureOpen();
      const buffer = Buffer.alloc(1);
      const read = __dartNodeFs.readSync(fd, buffer, 0, 1, position);
      if (read === 0) return -1;
      position += read;
      return buffer[0];
    },
    async readByte() { return this.readByteSync(); },
    readSync(count) {
      ensureOpen();
      const buffer = Buffer.alloc(Number(count));
      const read = __dartNodeFs.readSync(fd, buffer, 0, buffer.length, position);
      position += read;
      return Array.from(buffer.subarray(0, read));
    },
    async read(count) { return this.readSync(count); },
    readIntoSync(buffer, start = 0, end = null) {
      ensureOpen();
      const target = __dartIoToArray(buffer);
      const offset = Number(start);
      const stop = end == null ? target.length : Number(end);
      const temp = Buffer.alloc(Math.max(0, stop - offset));
      const read = __dartNodeFs.readSync(fd, temp, 0, temp.length, position);
      for (let i = 0; i < read; i++) target[offset + i] = temp[i];
      position += read;
      return read;
    },
    async readInto(buffer, start = 0, end = null) { return this.readIntoSync(buffer, start, end); },
    writeByteSync(value) {
      ensureOpen();
      const buffer = Buffer.from([Number(value) & 255]);
      __dartNodeFs.writeSync(fd, buffer, 0, 1, position);
      position += 1;
      return null;
    },
    async writeByte(value) { this.writeByteSync(value); return file; },
    writeFromSync(buffer, start = 0, end = null) {
      ensureOpen();
      const values = __dartIoToArray(buffer).slice(Number(start), end == null ? undefined : Number(end));
      const bytes = Buffer.from(values);
      __dartNodeFs.writeSync(fd, bytes, 0, bytes.length, position);
      position += bytes.length;
      return null;
    },
    async writeFrom(buffer, start = 0, end = null) { this.writeFromSync(buffer, start, end); return file; },
    writeStringSync(string, options = {}) {
      ensureOpen();
      const bytes = __dartIoEncodeBytes(string, options.encoding);
      __dartNodeFs.writeSync(fd, bytes, 0, bytes.length, position);
      position += bytes.length;
      return null;
    },
    async writeString(string, options = {}) { this.writeStringSync(string, options); return file; },
    positionSync() { ensureOpen(); return position; },
    async position() { return this.positionSync(); },
    setPositionSync(nextPosition) { ensureOpen(); position = Number(nextPosition); return null; },
    async setPosition(nextPosition) { this.setPositionSync(nextPosition); return file; },
    lengthSync() { ensureOpen(); return __dartNodeFs.fstatSync(fd).size; },
    async length() { return this.lengthSync(); },
    truncateSync(length) { ensureOpen(); __dartNodeFs.ftruncateSync(fd, Number(length)); if (position > Number(length)) position = Number(length); return null; },
    async truncate(length) { this.truncateSync(length); return file; },
    flushSync() { ensureOpen(); __dartNodeFs.fsyncSync(fd); return null; },
    async flush() { this.flushSync(); return file; },
    lockSync() { ensureOpen(); return null; },
    async lock() { return file; },
    unlockSync() { ensureOpen(); return null; },
    async unlock() { return file; },
    toString() { return "RandomAccessFile: '" + path + "'"; },
  };
  return file;
}
function __dartDirectory(path) {
  path = String(path);
  const directory = {
    __dartType: "Directory",
    get path() { return path; },
    get uri() { return __dartUriFile(path, globalThis.process?.platform === "win32", true); },
    get absolute() { return __dartDirectory(__dartNodePath.resolve(path)); },
    get parent() { return __dartDirectory(__dartNodePath.dirname(path)); },
    existsSync() {
      try { return __dartNodeFs.statSync(path).isDirectory(); } catch (_) { return false; }
    },
    exists() { return Promise.resolve(this.existsSync()); },
    createSync(options = {}) {
      try { __dartNodeFs.mkdirSync(path, { recursive: options.recursive === true }); return null; } catch (error) { __dartIoNodeError(error, "Cannot create directory", path); }
    },
    async create(options = {}) { this.createSync(options); return directory; },
    createTempSync(prefix = null) {
      try { return __dartDirectory(__dartNodeFs.mkdtempSync(__dartNodePath.join(path, String(prefix ?? "")))); } catch (error) { __dartIoNodeError(error, "Cannot create temporary directory", path); }
    },
    async createTemp(prefix = null) { return this.createTempSync(prefix); },
    deleteSync(options = {}) {
      try { __dartNodeFs.rmSync(path, { recursive: options.recursive === true, force: false }); return null; } catch (error) { __dartIoNodeError(error, "Cannot delete directory", path); }
    },
    async delete(options = {}) { this.deleteSync(options); return directory; },
    renameSync(newPath) {
      try { __dartNodeFs.renameSync(path, String(newPath)); return __dartDirectory(newPath); } catch (error) { __dartIoNodeError(error, "Cannot rename directory", path); }
    },
    async rename(newPath) { return this.renameSync(newPath); },
    listSync(options = {}) {
      const recursive = options.recursive === true;
      const followLinks = options.followLinks !== false;
      const result = [];
      const visit = (dir) => {
        for (const entry of __dartNodeFs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = __dartNodePath.join(dir, entry.name);
          const type = __dartFileSystemEntityType(fullPath, followLinks);
          const entity = type.index === 1 ? __dartDirectory(fullPath) : type.index === 2 ? __dartLink(fullPath) : __dartFile(fullPath);
          result.push(entity);
          if (recursive && type.index === 1) visit(fullPath);
        }
      };
      try { visit(path); return result; } catch (error) { __dartIoNodeError(error, "Directory listing failed", path); }
    },
    list(options = {}) { return __dartStreamFromIterable(this.listSync(options)); },
    statSync() { return __dartFileStat(path); },
    async stat() { return this.statSync(); },
    resolveSymbolicLinksSync() {
      try { return __dartNodeFs.realpathSync(path); } catch (error) { __dartIoNodeError(error, "Cannot resolve symbolic links", path); }
    },
    async resolveSymbolicLinks() { return this.resolveSymbolicLinksSync(); },
    childFile(name) { return __dartFile(__dartNodePath.join(path, String(name))); },
    childDirectory(name) { return __dartDirectory(__dartNodePath.join(path, String(name))); },
    childLink(name) { return __dartLink(__dartNodePath.join(path, String(name))); },
    toString() { return "Directory: '" + path + "'"; },
  };
  return Object.freeze(directory);
}
function __dartLink(path) {
  path = String(path);
  return Object.freeze({
    __dartType: "Link",
    get path() { return path; },
    get uri() { return __dartUriFile(path, globalThis.process?.platform === "win32", false); },
    get absolute() { return __dartLink(__dartNodePath.resolve(path)); },
    get parent() { return __dartDirectory(__dartNodePath.dirname(path)); },
    existsSync() { try { return __dartNodeFs.lstatSync(path).isSymbolicLink(); } catch (_) { return false; } },
    exists() { return Promise.resolve(this.existsSync()); },
    targetSync() { try { return __dartNodeFs.readlinkSync(path); } catch (error) { __dartIoNodeError(error, "Cannot read link", path); } },
    async target() { return this.targetSync(); },
    toString() { return "Link: '" + path + "'"; },
  });
}
function __dartFileSink(path, mode = null, encoding = null) {
  let closed = false;
  let firstWrite = true;
  const sink = {
    __dartType: "IOSink",
    get done() { return Promise.resolve(null); },
    write(value) {
      if (closed) throw __dartIoFileSystemException("File closed", path, null);
      const flag = firstWrite ? __dartIoModeFlag(mode, "w") : "a";
      firstWrite = false;
      __dartNodeFs.writeFileSync(path, __dartIoEncodeBytes(value, encoding), { flag });
      return null;
    },
    writeln(value = "") { this.write(String(value) + "\n"); return null; },
    writeAll(objects, separator = "") { this.write(Array.from(objects).join(String(separator))); return null; },
    writeCharCode(code) { this.write(String.fromCharCode(Number(code))); return null; },
    add(bytes) { this.write(Buffer.from(__dartIoToArray(bytes))); return null; },
    addError(error, stackTrace = null) { throw error; },
    addStream(stream) { for (const chunk of Array.from(stream)) this.add(chunk); return Promise.resolve(null); },
    flush() { return Promise.resolve(null); },
    close() { closed = true; return Promise.resolve(null); },
  };
  return sink;
}
function __dartStdSink(fd) {
  const stream = fd === 2 ? globalThis.process?.stderr : globalThis.process?.stdout;
  const sink = {
    __dartType: "Stdout",
    get hasTerminal() { return Boolean(stream?.isTTY); },
    get terminalColumns() { return Number(stream?.columns ?? 80); },
    get terminalLines() { return Number(stream?.rows ?? 24); },
    get supportsAnsiEscapes() { return Boolean(stream?.isTTY); },
    get nonBlocking() { return sink; },
    get done() { return Promise.resolve(null); },
    write(value) { stream?.write(String(value)); return null; },
    writeln(value = "") { stream?.write(String(value) + "\n"); return null; },
    writeAll(objects, separator = "") { stream?.write(Array.from(objects).join(String(separator))); return null; },
    writeCharCode(code) { stream?.write(String.fromCharCode(Number(code))); return null; },
    add(bytes) { stream?.write(Buffer.from(__dartIoToArray(bytes))); return null; },
    addError(error, stackTrace = null) { throw error; },
    addStream(streamValue) { for (const chunk of Array.from(streamValue)) this.add(chunk); return Promise.resolve(null); },
    flush() { return Promise.resolve(null); },
    close() { return Promise.resolve(null); },
  };
  return Object.freeze(sink);
}
function __dartStdout() {
  return __dartStdSink(1);
}
function __dartStderr() {
  return __dartStdSink(2);
}
function __dartStdin() {
  return Object.freeze({
    __dartType: "Stdin",
    get hasTerminal() { return Boolean(globalThis.process?.stdin?.isTTY); },
    readLineSync() { return null; },
  });
}
function __dartProcessRunSync(executable, arguments_, options = {}) {
  const result = __dartNodeChildProcess.spawnSync(String(executable), __dartIoToArray(arguments_).map(String), {
    cwd: options.workingDirectory == null ? undefined : String(options.workingDirectory),
    env: options.environment == null ? undefined : Object.fromEntries(options.environment instanceof Map ? options.environment : Object.entries(options.environment)),
    shell: options.runInShell === true,
    encoding: null,
  });
  if (result.error) __dartIoNodeError(result.error, "Process failed", String(executable));
  const stdout = options.stdoutEncoding === null ? Array.from(result.stdout ?? []) : __dartIoDecodeBytes(result.stdout ?? [], options.stdoutEncoding);
  const stderr = options.stderrEncoding === null ? Array.from(result.stderr ?? []) : __dartIoDecodeBytes(result.stderr ?? [], options.stderrEncoding);
  return __dartProcessResult(result.pid ?? 0, result.status ?? 0, stdout, stderr);
}
function __dartProcessRun(executable, arguments_, options = {}) {
  return new Promise((resolve, reject) => {
    const child = __dartNodeChildProcess.spawn(String(executable), __dartIoToArray(arguments_).map(String), {
      cwd: options.workingDirectory == null ? undefined : String(options.workingDirectory),
      env: options.environment == null ? undefined : Object.fromEntries(options.environment instanceof Map ? options.environment : Object.entries(options.environment)),
      shell: options.runInShell === true,
    });
    const stdout = [];
    const stderr = [];
    child.stdout?.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr?.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", (error) => reject(__dartIoFileSystemException(error.message, String(executable), __dartIoOSError(error.message, error.errno ?? -1))));
    child.on("close", (code) => {
      const out = Buffer.concat(stdout);
      const err = Buffer.concat(stderr);
      resolve(__dartProcessResult(child.pid ?? 0, code ?? 0, options.stdoutEncoding === null ? Array.from(out) : __dartIoDecodeBytes(out, options.stdoutEncoding), options.stderrEncoding === null ? Array.from(err) : __dartIoDecodeBytes(err, options.stderrEncoding)));
    });
  });
}
'''),
      _ => throw StateError('Unexpected io helper declaration: $helper'),
    };
  }
}
