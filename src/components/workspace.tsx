"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Button,
  Badge,
  Callout,
  Checkbox,
  Dialog,
  Progress,
  Select,
  Switch,
  TextArea,
  TextField,
  Spinner,
} from "@radix-ui/themes";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DashboardIcon,
  ExitIcon,
  FileIcon,
  GearIcon,
  Link2Icon,
  MixerHorizontalIcon,
  PlusIcon,
  ReloadIcon,
  RocketIcon,
  UploadIcon,
  VideoIcon,
} from "@radix-ui/react-icons";
import { authClient } from "@/lib/auth-client";
import { plans } from "@/lib/plans";
import type { Options } from "@/lib/types";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
interface Account {
  id: string;
  platform: string;
  label: string;
  status: string;
  active: boolean;
  external_id: string;
}
interface Video {
  id: string;
  name: string;
  size: string;
  duration: number;
  width: number;
  height: number;
  created_at: string;
}
interface Target {
  id: string;
  connectionId: string;
  platform: string;
  label: string;
  status: string;
  error: string | null;
  url: string | null;
  options: Options;
}
interface Post {
  id: string;
  media_id: string;
  media_name: string;
  caption: string;
  timezone: string;
  scheduled_at: string | null;
  created_at: string;
  destinations: Target[];
}
interface Data {
  user: { name: string; email: string };
  connections: Account[];
  media: Video[];
  posts: Post[];
  subscription: {
    plan: keyof typeof plans;
    status: string;
    period_end: string;
    cancel_at_period_end: boolean;
  } | null;
  usage: {
    consumed: string;
    reserved: string;
    consumed_bytes?: string;
    reserved_bytes?: string;
  };
  capabilities: {
    drivePicker: boolean;
    billing: boolean;
    youtubePublic: boolean;
    tiktokPublic: boolean;
  };
}
const titles: Record<string, string> = {
  overview: "Your publishing desk",
  compose: "Create a post",
  library: "Video library",
  calendar: "Publishing calendar",
  posts: "All posts",
  accounts: "Connected accounts",
  billing: "Your plan",
  settings: "Settings",
};
const names: Record<string, string> = {
  drive: "Google Drive",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};
const nav = [
  ["overview", "Overview", DashboardIcon],
  ["compose", "Create post", PlusIcon],
  ["calendar", "Calendar", CalendarIcon],
  ["library", "Video library", VideoIcon],
  ["posts", "All posts", FileIcon],
  ["accounts", "Accounts", Link2Icon],
] as const;
async function api(path: string, method = "GET", data?: unknown) {
  const r = await fetch(`/api/${path}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error || "Something went wrong.");
  return result;
}
const date = (value: string, zone?: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: zone,
  }).format(new Date(value));
function Platform({ platform }: { platform: string }) {
  return (
    <span
      className={`platform platform-${platform}`}
      aria-label={names[platform]}
    >
      {
        (
          {
            youtube: "YT",
            instagram: "IG",
            facebook: "f",
            tiktok: "Tk",
            drive: "D",
          } as Record<string, string>
        )[platform]
      }
    </span>
  );
}
function Status({ value }: { value: string }) {
  return (
    <Badge
      color={
        value === "published"
          ? "green"
          : ["failed", "attention"].includes(value)
            ? "red"
            : value === "paused"
              ? "amber"
              : "gray"
      }
      variant="soft"
    >
      {value.replaceAll("_", " ")}
    </Badge>
  );
}
function Empty({
  icon = VideoIcon,
  title,
  children,
  action,
}: {
  icon?: typeof VideoIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon width={26} height={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Workspace({
  screen,
  configured,
}: {
  screen: string;
  configured: boolean;
}) {
  if (!configured) return <Welcome setup />;
  return <SessionWorkspace screen={screen} />;
}
function Welcome({ setup = false }: { setup?: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true);
    const r = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (r.error) {
      setError(r.error.message || "Sign-in failed.");
      setBusy(false);
    }
  }
  return (
    <main className="welcome">
      <div className="welcome-brand">
        <span className="brand-symbol">
          <RocketIcon />
        </span>{" "}
        Social Publisher
      </div>
      <div className="welcome-content">
        <Badge size="2" color="gray">
          One workspace. Four platforms.
        </Badge>
        <h1>
          Your next video.
          <br />
          <span>Everywhere it belongs.</span>
        </h1>
        <p>
          Bring a video from your Google Drive, choose your channels, and give
          it a time to go live.
        </p>
        <div className="platform-line">
          {["instagram", "youtube", "tiktok", "facebook"].map((p) => (
            <Platform platform={p} key={p} />
          ))}
        </div>
        {setup ? (
          <Callout.Root className="setup-callout">
            <Callout.Text>
              The workspace is ready for setup. Add your Google OAuth
              credentials, database connection, and app secrets to enable
              sign-in. See the project README for the setup steps.
            </Callout.Text>
          </Callout.Root>
        ) : (
          <Button size="3" onClick={login} disabled={busy}>
            {busy ? <Spinner /> : null}Continue with Google <ArrowRightIcon />
          </Button>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <p className="welcome-note">
          Your videos stay in your Drive. You control what gets posted.
        </p>
      </div>
      <footer>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/data-deletion">Data deletion</Link>
      </footer>
    </main>
  );
}
function SessionWorkspace({ screen }: { screen: string }) {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await api("workspace"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    if (!session) return;
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 20000);
    return () => clearInterval(timer);
  }, [session, load]);
  if (isPending)
    return (
      <div className="full-loading">
        <Spinner size="3" />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!session) return <Welcome />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-symbol">
            <RocketIcon />
          </span>
          <span>
            Social
            <br />
            Publisher
          </span>
        </Link>
        <div className="workspace-label">CREATOR WORKSPACE</div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <Link
              key={id}
              href={id === "overview" ? "/" : `/${id}`}
              className={screen === id ? "nav-link active" : "nav-link"}
              aria-current={screen === id ? "page" : undefined}
            >
              <Icon width={18} height={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link
            className={`nav-link ${screen === "billing" ? "active" : ""}`}
            href="/billing"
          >
            <MixerHorizontalIcon />
            {data?.subscription
              ? `${plans[data.subscription.plan].name} plan`
              : "Choose a plan"}
          </Link>
          <Link
            className={`nav-link ${screen === "settings" ? "active" : ""}`}
            href="/settings"
          >
            <GearIcon />
            Settings
          </Link>
          <button
            className="profile"
            onClick={() => authClient.signOut()}
            title="Sign out"
          >
            <span className="avatar">
              {session.user.name?.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{session.user.name}</strong>
              <small>Personal workspace</small>
            </span>
            <ExitIcon />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Workspace{" "}
            <span className="breadcrumb">
              / {screen === "overview" ? "Overview" : titles[screen]}
            </span>
          </span>
          <Badge color="gray">Videos stored in your Drive</Badge>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <h1>{titles[screen]}</h1>
              <p>
                {
                  (
                    {
                      overview: "A little planning. A lot more creating.",
                      compose: "One video, ready for every selected channel.",
                      library:
                        "Ready-to-post videos, kept in your own Google Drive.",
                      calendar: "Make room for your next great post.",
                      posts: "Every destination, every result.",
                      accounts: "Your channels, together in one place.",
                      billing: "Choose the room you need to grow.",
                      settings: "Manage your identity and account.",
                    } as Record<string, string>
                  )[screen]
                }
              </p>
            </div>
            {screen !== "compose" && (
              <Button asChild size="3">
                <Link href="/compose">
                  <PlusIcon />
                  Create post
                </Link>
              </Button>
            )}
          </div>
          {error && (
            <Callout.Root color="red" role="alert">
              <Callout.Text>{error}</Callout.Text>
              <Button onClick={load} variant="soft">
                Try again
              </Button>
            </Callout.Root>
          )}
          {!data ? (
            <div className="loading">
              <Spinner />
              Loading your workspace…
            </div>
          ) : (
            <>
              <div className="test-banner">
                Billing is in test mode. Public publishing becomes available
                after platform approval.
              </div>
              {screen === "overview" ? (
                <Overview data={data} reload={load} />
              ) : screen === "compose" ? (
                <Composer data={data} reload={load} />
              ) : screen === "library" ? (
                <Library data={data} reload={load} />
              ) : screen === "accounts" ? (
                <Accounts data={data} reload={load} />
              ) : screen === "billing" ? (
                <Billing data={data} />
              ) : screen === "calendar" ? (
                <Calendar data={data} reload={load} />
              ) : screen === "posts" ? (
                <PostList posts={data.posts} reload={load} />
              ) : (
                <Settings data={data} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
function Overview({
  data,
  reload,
}: {
  data: Data;
  reload: () => Promise<void>;
}) {
  const targets = data.posts.flatMap((p) => p.destinations);
  const upcoming = data.posts
    .filter((p) =>
      p.destinations.some((d) =>
        ["scheduled", "queued", "processing"].includes(d.status),
      ),
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at || 0).getTime() -
        new Date(b.scheduled_at || 0).getTime(),
    );
  return (
    <>
      <div className="stats-row">
        {[
          [
            "Scheduled",
            targets.filter((d) => ["scheduled", "queued"].includes(d.status))
              .length,
          ],
          ["Published", data.usage.consumed || 0],
          [
            "Bandwidth",
            `${(
              (Number(data.usage.consumed_bytes || 0) +
                Number(data.usage.reserved_bytes || 0)) /
              1024 ** 3
            ).toFixed(1)} GB`,
          ],
          [
            "Needs attention",
            targets.filter((d) =>
              ["failed", "paused", "attention"].includes(d.status),
            ).length,
          ],
          [
            "Connected channels",
            data.connections.filter(
              (c) => c.platform !== "drive" && c.status === "connected",
            ).length,
          ],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section>
          <div className="section-heading">
            <h2>Up next</h2>
            <Link href="/calendar">
              View calendar <ArrowRightIcon />
            </Link>
          </div>
          <PostList posts={upcoming.slice(0, 5)} reload={reload} />
        </section>
        <aside className="getting-started">
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>
            A simple setup.
            <br />A smoother week.
          </h2>
          <p>
            Connect your storage and channels, then put your first video on the
            calendar.
          </p>
          {[
            [
              data.connections.some(
                (c) => c.platform === "drive" && c.status === "connected",
              ),
              "Connect Google Drive",
              "/accounts",
            ],
            [
              data.connections.some(
                (c) => c.platform !== "drive" && c.status === "connected",
              ),
              "Add a social account",
              "/accounts",
            ],
            [
              !!data.subscription && data.subscription.status === "active",
              "Choose your plan",
              "/billing",
            ],
            [data.posts.length > 0, "Create your first post", "/compose"],
          ].map(([done, label, href]) => (
            <Link
              className="setup-step"
              key={String(label)}
              href={String(href)}
            >
              <span className={done ? "step done" : "step"}>
                {done ? <CheckIcon /> : <ArrowRightIcon />}
              </span>
              {label}
            </Link>
          ))}
        </aside>
      </div>
    </>
  );
}
function PostList({
  posts,
  reload,
}: {
  posts: Post[];
  reload: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  async function action(path: string) {
    setBusy(path);
    try {
      await api(path, "POST", {});
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  if (!posts.length)
    return (
      <Empty
        title="Your next post starts here"
        action={
          <Button asChild variant="soft">
            <Link href="/compose">
              Create your first post <ArrowRightIcon />
            </Link>
          </Button>
        }
      >
        Pick a video, choose your channels, and publish on your own schedule.
      </Empty>
    );
  return (
    <div className="post-list">
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {posts.map((p) => (
        <article className="post-row" key={p.id}>
          <div className="video-marker">
            <VideoIcon width={23} height={23} />
            <span>
              {p.destinations.length}{" "}
              {p.destinations.length === 1 ? "channel" : "channels"}
            </span>
          </div>
          <div className="post-info">
            <h3>{p.media_name}</h3>
            <p className="caption-excerpt">
              {p.caption || "No shared caption"}
            </p>
            <small>
              {p.scheduled_at ? date(p.scheduled_at, p.timezone) : "Draft"}
              {p.scheduled_at ? ` · ${p.timezone}` : ""}
            </small>
            <div className="target-list">
              {p.destinations.map((d) => (
                <div key={d.id} className="target-result">
                  <Platform platform={d.platform} />
                  <span>{d.label}</span>
                  <Status value={d.status} />
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer">
                      View post
                    </a>
                  )}
                  {["failed", "paused", "attention"].includes(d.status) && (
                    <Button
                      size="1"
                      variant="ghost"
                      disabled={!!busy}
                      onClick={() => action(`destinations/${d.id}/retry`)}
                    >
                      {busy === `destinations/${d.id}/retry` ? (
                        <Spinner />
                      ) : (
                        <ReloadIcon />
                      )}
                      {d.status === "attention" ? "Check status" : "Retry"}
                    </Button>
                  )}
                  {d.status === "attention" && (
                    <ReviewOutcome target={d} reload={reload} />
                  )}
                  {d.error && <p className="target-error">{d.error}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="post-actions">
            {p.destinations.every((d) =>
              ["draft", "scheduled", "paused", "canceled"].includes(d.status),
            ) && (
              <Button asChild variant="soft" size="1">
                <Link href={`/compose?edit=${p.id}`}>Edit</Link>
              </Button>
            )}
            {p.destinations.every((d) =>
              ["draft", "scheduled", "queued", "paused", "failed"].includes(
                d.status,
              ),
            ) && (
              <Button
                variant="ghost"
                color="gray"
                size="1"
                disabled={!!busy}
                onClick={() => action(`posts/${p.id}/cancel`)}
              >
                Cancel
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
function ReviewOutcome({
  target,
  reload,
}: {
  target: Target;
  reload: () => Promise<void>;
}) {
  const [confirmed, setConfirmed] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState(false);
  async function resolve(resolution: "published" | "not_published") {
    setBusy(true);
    try {
      await api(`destinations/${target.id}/resolve`, "POST", {
        resolution,
        confirmed,
      });
      await reload();
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="1" variant="ghost">
          Review outcome
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Check {target.label}</Dialog.Title>
        <Dialog.Description>
          Open your account on {names[target.platform]} and check whether this
          video was published. Marking it as not published enables a fresh
          retry, which could create a duplicate if the original exists.
        </Dialog.Description>
        <label className="inline" style={{ marginTop: 20 }}>
          <Checkbox
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(!!v)}
          />
          I checked this account on the platform.
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button
            variant="soft"
            disabled={!confirmed || busy}
            onClick={() => resolve("not_published")}
          >
            It wasn’t published
          </Button>
          <Button
            disabled={!confirmed || busy}
            onClick={() => resolve("published")}
          >
            It was published
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
function Accounts({
  data,
  reload,
}: {
  data: Data;
  reload: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  async function connect(p: string) {
    setBusy(p);
    setError("");
    try {
      const r = await api(`connections/authorize/${p}`, "POST", {});
      location.assign(r.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }
  async function change(c: Account, disconnect = false) {
    setBusy(c.id);
    try {
      await api(
        `connections/${c.id}${disconnect ? "" : "/active"}`,
        disconnect ? "DELETE" : "POST",
        disconnect ? undefined : { active: !c.active },
      );
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      {error && (
        <Callout.Root color="red" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <div className="storage-banner">
        <Platform platform="drive" />
        <div>
          <h2>Your Drive is your video library</h2>
          <p>
            Only files you upload or select are accessible to Social Publisher.
          </p>
        </div>
        <Button
          variant="soft"
          disabled={!!busy}
          onClick={() => connect("drive")}
        >
          {data.connections.some(
            (c) => c.platform === "drive" && c.status === "connected",
          )
            ? "Reconnect Drive"
            : "Connect Drive"}
        </Button>
      </div>
      <div className="section-heading">
        <h2>Social channels</h2>
        <span className="muted">Multiple accounts, one workspace</span>
      </div>
      <div className="connect-grid">
        {[
          ["instagram", "Professional accounts"],
          ["youtube", "Channels and Shorts"],
          ["tiktok", "Creator video publishing"],
          ["facebook", "Pages and Reels"],
        ].map(([p, description]) => (
          <div className="connect-card" key={p}>
            <Platform platform={p} />
            <h3>{names[p]}</h3>
            <p>{description}</p>
            <Button
              variant="outline"
              disabled={!!busy}
              onClick={() =>
                connect(p === "instagram" || p === "facebook" ? "meta" : p)
              }
            >
              <PlusIcon />
              Connect {names[p]}
            </Button>
          </div>
        ))}
      </div>
      <p className="muted">
        Instagram connections require a professional account linked to a
        Facebook Page. Facebook personal profiles are not supported.
      </p>
      <section className="account-list">
        <h2>Your connections</h2>
        {data.connections.length === 0 ? (
          <Empty icon={Link2Icon} title="A home for all your channels">
            Connect Google Drive and a social account to get started.
          </Empty>
        ) : (
          data.connections.map((c) => (
            <div className="account-row" key={c.id}>
              <Platform platform={c.platform} />
              <div>
                <strong>{c.label}</strong>
                <small>{names[c.platform]}</small>
              </div>
              <Status value={c.status} />
              {c.platform !== "drive" && c.status !== "disconnected" && (
                <label className="inline">
                  <Switch
                    checked={c.active}
                    disabled={!!busy}
                    onCheckedChange={() => change(c)}
                  />
                  Active
                </label>
              )}
              {c.status !== "disconnected" && (
                <Dialog.Root>
                  <Dialog.Trigger>
                    <Button variant="ghost" color="gray">
                      Disconnect
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Content maxWidth="420px">
                    <Dialog.Title>Disconnect {c.label}?</Dialog.Title>
                    <Dialog.Description>
                      Affected scheduled posts will pause. Your original Drive
                      videos remain untouched.
                    </Dialog.Description>
                    <div className="dialog-actions">
                      <Dialog.Close>
                        <Button variant="soft">Keep connected</Button>
                      </Dialog.Close>
                      <Dialog.Close>
                        <Button color="red" onClick={() => change(c, true)}>
                          Disconnect
                        </Button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Root>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
function Library({
  data,
  reload,
}: {
  data: Data;
  reload: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null),
    pendingFile = useRef<File | null>(null),
    uploadUrl = useRef("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [done, setDone] = useState("");
  const connected = data.connections.some(
    (c) => c.platform === "drive" && c.status === "connected",
  );
  async function importId(id: string) {
    await api("drive/import", "POST", { fileId: id });
    await reload();
    setDone("Video added to your library.");
  }
  async function upload(file: File, resume = false) {
    setBusy(true);
    setError("");
    setDone("");
    pendingFile.current = file;
    try {
      if (!resume) {
        const r = await api("drive/upload", "POST", {
          name: file.name,
          mimeType:
            file.type ||
            (/\.mov$/i.test(file.name) ? "video/quicktime" : "video/mp4"),
          size: file.size,
        });
        uploadUrl.current = r.uploadUrl;
      }
      let offset = 0;
      if (resume) {
        const r = await fetch(uploadUrl.current, {
          method: "PUT",
          headers: { "Content-Range": `bytes */${file.size}` },
        });
        if (r.ok) {
          const f = await r.json();
          await importId(f.id);
          uploadUrl.current = "";
          return;
        }
        if (r.status !== 308)
          throw new Error(
            "This upload session expired. Start the upload again.",
          );
        offset = r.headers.get("Range")
          ? Number(r.headers.get("Range")!.split("-").at(-1)) + 1
          : 0;
      }
      while (offset < file.size) {
        const end = Math.min(offset + 8 * 1024 * 1024, file.size);
        const r = await fetch(uploadUrl.current, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "video/mp4",
            "Content-Range": `bytes ${offset}-${end - 1}/${file.size}`,
          },
          body: file.slice(offset, end),
        });
        if (r.status === 308) {
          offset =
            Number(r.headers.get("Range")?.split("-").at(-1) ?? end - 1) + 1;
          setProgress(Math.round((offset / file.size) * 100));
        } else if (r.ok) {
          const f = await r.json();
          setProgress(100);
          uploadUrl.current = "";
          pendingFile.current = null;
          try {
            await importId(f.id);
          } catch {
            setDone(
              "Uploaded to Drive. Once Drive finishes processing, select this video with “Choose from Drive”.",
            );
          }
          break;
        } else
          throw new Error(
            `Drive could not receive this chunk (HTTP ${r.status}). Check your available storage, then resume.`,
          );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function picker() {
    setBusy(true);
    setError("");
    try {
      const config = await api("drive/picker", "POST", {});
      if (!config.apiKey)
        throw new Error(
          "Google Picker is not configured yet. Add the Picker API key.",
        );
      await new Promise<void>((resolve, reject) => {
        if ((window as any).gapi) return resolve();
        const s = document.createElement("script");
        s.src = "https://apis.google.com/js/api.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Google Picker could not load."));
        document.head.appendChild(s);
      });
      const w = window as any;
      await new Promise<void>((resolve) => w.gapi.load("picker", resolve));
      const view = new w.google.picker.DocsView(
        w.google.picker.ViewId.DOCS_VIDEOS,
      ).setMimeTypes("video/mp4,video/quicktime");
      new w.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(config.accessToken)
        .setDeveloperKey(config.apiKey)
        .setAppId(config.appId)
        .setOrigin(location.origin)
        .setCallback(async (r: any) => {
          if (r.action === w.google.picker.Action.PICKED) {
            try {
              await importId(r.docs[0].id);
            } catch (e) {
              setError((e as Error).message);
            }
          }
        })
        .build()
        .setVisible(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!connected && (
        <Callout.Root>
          <Callout.Text>
            Connect Google Drive to upload or select videos.{" "}
            <Link href="/accounts">Connect your Drive</Link>
          </Callout.Text>
        </Callout.Root>
      )}
      <div className="upload-zone">
        <UploadIcon width={32} height={32} />
        <h2>Give your next post a starting point</h2>
        <p>
          MP4 or MOV, up to{" "}
          {data.subscription &&
          plans[data.subscription.plan]?.maxVideoBytes > 2 * 1024 ** 3
            ? "10 GB"
            : "2 GB"}
          . Originals stay in your Google Drive.
        </p>
        <div className="button-row">
          <Button
            onClick={() => input.current?.click()}
            disabled={!connected || busy}
          >
            <UploadIcon />
            Upload video
          </Button>
          <Button variant="soft" onClick={picker} disabled={!connected || busy}>
            Choose from Drive
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          accept="video/mp4,video/quicktime,.mov"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        {busy && (
          <div className="upload-progress">
            <Progress value={progress} />
            <span>{progress ? `${progress}% uploaded` : "Preparing…"}</span>
          </div>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {error && uploadUrl.current && pendingFile.current && (
          <Button
            variant="soft"
            disabled={busy}
            onClick={() => upload(pendingFile.current!, true)}
          >
            Resume upload
          </Button>
        )}
        {done && <p role="status">{done}</p>}
      </div>
      <div className="section-heading">
        <h2>Your videos</h2>
        <span className="muted">{data.media.length} in your library</span>
      </div>
      {data.media.length === 0 ? (
        <Empty title="Your library is ready">
          Upload a video or bring one over from Google Drive.
        </Empty>
      ) : (
        <div className="media-grid">
          {data.media.map((m) => (
            <article className="media-card" key={m.id}>
              <video
                controls
                preload="none"
                src={`/api/media/${m.id}/preview`}
                aria-label={m.name}
              />
              <div>
                <h3>{m.name}</h3>
                <p>
                  {Math.floor(m.duration / 60)}:
                  {Math.floor(m.duration % 60)
                    .toString()
                    .padStart(2, "0")}{" "}
                  · {m.width} × {m.height} ·{" "}
                  {(Number(m.size) / 1024 ** 2).toFixed(0)} MB
                </p>
                <Button asChild variant="soft" size="2">
                  <Link href={`/compose?media=${m.id}`}>
                    Create post <ArrowRightIcon />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function Composer({
  data,
  reload,
}: {
  data: Data;
  reload: () => Promise<void>;
}) {
  const search = useSearchParams(),
    router = useRouter();
  const edit = data.posts.find((p) => p.id === search.get("edit"));
  const [mediaId, setMediaId] = useState(
      edit?.media_id || search.get("media") || "",
    ),
    [caption, setCaption] = useState(edit?.caption || ""),
    [selected, setSelected] = useState<Record<string, Options>>(() =>
      Object.fromEntries(
        edit?.destinations.map((d) => [d.connectionId, d.options]) || [],
      ),
    );
  const [timezone, setTimezone] = useState(
      edit?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
    [when, setWhen] = useState(
      edit?.scheduled_at
        ? formatInTimeZone(
            edit.scheduled_at,
            edit.timezone,
            "yyyy-MM-dd'T'HH:mm",
          )
        : "",
    ),
    [mode, setMode] = useState<"now" | "schedule">(
      edit?.scheduled_at ? "schedule" : "now",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [creators, setCreators] = useState<Record<string, any>>({});
  const video = data.media.find((m) => m.id === mediaId),
    accounts = data.connections.filter(
      (c) => c.platform !== "drive" && c.active && c.status === "connected",
    );
  const update = (id: string, o: Partial<Options>) =>
    setSelected((s) => ({ ...s, [id]: { ...s[id], ...o } }));
  useEffect(() => {
    for (const id of Object.keys(selected)) {
      if (
        accounts.find((a) => a.id === id)?.platform === "tiktok" &&
        !creators[id]
      )
        api(`connections/${id}/creator`)
          .then((c) => setCreators((old) => ({ ...old, [id]: c })))
          .catch((e) => setError(e.message));
    }
  }, [Object.keys(selected).join(",")]);
  function toggle(a: Account, checked: boolean) {
    if (checked)
      setSelected((s) => ({
        ...s,
        [a.id]:
          a.platform === "youtube"
            ? { privacy: "private", title: "" }
            : a.platform === "facebook"
              ? { format: "video" }
              : {},
      }));
    else
      setSelected((s) => {
        const next = { ...s };
        delete next[a.id];
        return next;
      });
  }
  async function save(draft = false) {
    setBusy(true);
    setError("");
    try {
      let scheduledAt: string | null = null;
      if (!draft && mode === "schedule") {
        if (!when) throw new Error("Choose a date and time.");
        const utc = fromZonedTime(when, timezone);
        if (formatInTimeZone(utc, timezone, "yyyy-MM-dd'T'HH:mm") !== when)
          throw new Error(
            "This time does not exist because the clocks change. Choose another time.",
          );
        scheduledAt = utc.toISOString();
      }
      await api(edit ? `posts/${edit.id}` : "posts", edit ? "PATCH" : "POST", {
        mediaId,
        caption,
        timezone,
        scheduledAt,
        mode: draft ? "draft" : mode,
        destinations: Object.entries(selected).map(
          ([connectionId, options]) => ({ connectionId, options }),
        ),
      });
      await reload();
      router.push("/posts");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="composer">
      <section className="compose-fields">
        <div className="form-section">
          <h2>
            <span className="section-number">1</span>Your video
          </h2>
          <label className="field">
            Choose from your library
            <Select.Root value={mediaId} onValueChange={setMediaId}>
              <Select.Trigger placeholder="Select a video" />
              <Select.Content>
                {data.media.map((m) => (
                  <Select.Item value={m.id} key={m.id}>
                    {m.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>
          <Link className="text-link" href="/library">
            <PlusIcon />
            Upload or choose from Drive
          </Link>
        </div>
        <div className="form-section">
          <h2>
            <span className="section-number">2</span>Where it goes
          </h2>
          {!accounts.length ? (
            <p>
              No active channels yet.{" "}
              <Link href="/accounts">Connect an account</Link>.
            </p>
          ) : (
            <div className="destination-picker">
              {accounts.map((a) => (
                <label
                  key={a.id}
                  className={`destination-choice ${selected[a.id] ? "selected" : ""}`}
                >
                  <Checkbox
                    checked={!!selected[a.id]}
                    onCheckedChange={(v) => toggle(a, !!v)}
                  />
                  <Platform platform={a.platform} />
                  <span>
                    <strong>{a.label}</strong>
                    <small>{names[a.platform]}</small>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="form-section">
          <h2>
            <span className="section-number">3</span>Make it yours
          </h2>
          <label className="field">
            Shared caption
            <TextArea
              rows={4}
              placeholder="What’s the story behind this video?"
              maxLength={5000}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
          <p className="field-hint">
            Fine-tune the text and settings for each channel below.
          </p>
          {accounts
            .filter((a) => selected[a.id])
            .map((a) => {
              const o = selected[a.id],
                creator = creators[a.id];
              return (
                <div className="platform-options" key={a.id}>
                  <h3>
                    <Platform platform={a.platform} />
                    {creator?.creator_nickname || a.label}
                  </h3>
                  {["youtube", "facebook"].includes(a.platform) && (
                    <label className="field">
                      Title
                      <TextField.Root
                        value={o.title || ""}
                        maxLength={100}
                        onChange={(e) =>
                          update(a.id, { title: e.target.value })
                        }
                        placeholder="Give your video a title"
                      />
                    </label>
                  )}
                  <label className="field">
                    {a.platform === "youtube" ? "Description" : "Caption"}{" "}
                    override
                    <TextArea
                      value={o.description ?? ""}
                      placeholder="Use the shared caption"
                      onChange={(e) =>
                        update(a.id, {
                          description: e.target.value || undefined,
                        })
                      }
                    />
                  </label>
                  {a.platform === "youtube" && (
                    <>
                      <label className="field">
                        Visibility
                        <Select.Root
                          value={o.privacy}
                          onValueChange={(privacy) => update(a.id, { privacy })}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            <Select.Item value="private">Private</Select.Item>
                            <Select.Item
                              value="unlisted"
                              disabled={!data.capabilities.youtubePublic}
                            >
                              Unlisted
                            </Select.Item>
                            <Select.Item
                              value="public"
                              disabled={!data.capabilities.youtubePublic}
                            >
                              Public
                            </Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </label>
                      <label className="field">
                        Audience
                        <Select.Root
                          value={
                            o.madeForKids === undefined
                              ? ""
                              : String(o.madeForKids)
                          }
                          onValueChange={(v) =>
                            update(a.id, { madeForKids: v === "true" })
                          }
                        >
                          <Select.Trigger placeholder="Is this video made for kids?" />
                          <Select.Content>
                            <Select.Item value="false">
                              No, it’s not made for kids
                            </Select.Item>
                            <Select.Item value="true">
                              Yes, it’s made for kids
                            </Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </label>
                    </>
                  )}
                  {a.platform === "facebook" && (
                    <label className="field">
                      Post format
                      <Select.Root
                        value={o.format || "video"}
                        onValueChange={(format) =>
                          update(a.id, { format: format as "video" | "reel" })
                        }
                      >
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value="video">Video</Select.Item>
                          <Select.Item value="reel">Reel</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </label>
                  )}
                  {a.platform === "instagram" && (
                    <p className="field-hint">
                      Publishes as a Reel on your professional account.
                    </p>
                  )}
                  {a.platform === "tiktok" && (
                    <>
                      {!creator ? (
                        <p>
                          <Spinner />
                          Loading current TikTok settings…
                        </p>
                      ) : (
                        <>
                          <label className="field">
                            Who can watch?
                            <Select.Root
                              value={o.privacy || ""}
                              onValueChange={(privacy) =>
                                update(a.id, { privacy })
                              }
                            >
                              <Select.Trigger placeholder="Choose privacy" />
                              <Select.Content>
                                {creator.privacy_level_options.map(
                                  (p: string) => (
                                    <Select.Item
                                      key={p}
                                      value={p}
                                      disabled={
                                        (!data.capabilities.tiktokPublic &&
                                          p !== "SELF_ONLY") ||
                                        (o.branded && p === "SELF_ONLY")
                                      }
                                    >
                                      {p.replaceAll("_", " ").toLowerCase()}
                                    </Select.Item>
                                  ),
                                )}
                              </Select.Content>
                            </Select.Root>
                          </label>
                          <div className="checkbox-row">
                            {[
                              [
                                "allowComment",
                                "comment_disabled",
                                "Allow comments",
                              ],
                              ["allowDuet", "duet_disabled", "Allow duet"],
                              [
                                "allowStitch",
                                "stitch_disabled",
                                "Allow stitch",
                              ],
                            ].map(([key, disabled, label]) => (
                              <label className="inline" key={key}>
                                <Checkbox
                                  checked={!!o[key as keyof Options]}
                                  disabled={creator[disabled]}
                                  onCheckedChange={(v) =>
                                    update(a.id, { [key]: !!v })
                                  }
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                      <label className="inline">
                        <Switch
                          checked={!!o.commercial}
                          onCheckedChange={(v) =>
                            update(a.id, {
                              commercial: v,
                              ...(!v
                                ? { ownBrand: false, branded: false }
                                : {}),
                            })
                          }
                        />
                        This video promotes a brand, product, or service
                      </label>
                      {o.commercial && (
                        <>
                          <label className="inline">
                            <Checkbox
                              checked={!!o.ownBrand}
                              onCheckedChange={(v) =>
                                update(a.id, { ownBrand: !!v })
                              }
                            />
                            Your brand · labeled Promotional content
                          </label>
                          <label className="inline">
                            <Checkbox
                              checked={!!o.branded}
                              disabled={o.privacy === "SELF_ONLY"}
                              onCheckedChange={(v) =>
                                update(a.id, { branded: !!v })
                              }
                            />
                            Branded content · labeled Paid partnership
                          </label>
                          {o.privacy === "SELF_ONLY" && (
                            <p className="field-hint">
                              Branded content cannot be private.
                            </p>
                          )}
                        </>
                      )}
                      <label className="consent">
                        <Checkbox
                          checked={!!o.consent}
                          onCheckedChange={(v) =>
                            update(a.id, { consent: !!v })
                          }
                        />
                        <span>
                          I consent to upload this video and agree to TikTok’s{" "}
                          <a
                            href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Music Usage Confirmation
                          </a>
                          {o.branded && (
                            <>
                              {" "}
                              and{" "}
                              <a
                                href="https://www.tiktok.com/legal/page/global/bc-policy/en"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Branded Content Policy
                              </a>
                            </>
                          )}
                          .
                        </span>
                      </label>
                    </>
                  )}
                </div>
              );
            })}
        </div>
        <div className="form-section">
          <h2>
            <span className="section-number">4</span>Pick your moment
          </h2>
          <div className="segmented">
            <button
              className={mode === "now" ? "chosen" : ""}
              onClick={() => setMode("now")}
            >
              Publish now
            </button>
            <button
              className={mode === "schedule" ? "chosen" : ""}
              onClick={() => setMode("schedule")}
            >
              Schedule for later
            </button>
          </div>
          {mode === "schedule" && (
            <div className="schedule-fields">
              <label className="field">
                Date and time
                <input
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              </label>
              <label className="field">
                Timezone
                <input
                  list="timezones"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
                <datalist id="timezones">
                  {Intl.supportedValuesOf("timeZone").map((z) => (
                    <option key={z} value={z} />
                  ))}
                </datalist>
              </label>
            </div>
          )}
          <p className="field-hint">
            Each platform processes videos separately. Publication times may
            vary.
          </p>
        </div>
        {error && (
          <Callout.Root color="red" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        <div className="compose-footer">
          <Button
            variant="soft"
            disabled={busy || !video || !Object.keys(selected).length}
            onClick={() => save(true)}
          >
            Save draft
          </Button>
          <Button
            size="3"
            disabled={busy || !video || !Object.keys(selected).length}
            onClick={() => save()}
          >
            {busy ? (
              <Spinner />
            ) : mode === "now" ? (
              <RocketIcon />
            ) : (
              <CalendarIcon />
            )}
            {mode === "now" ? "Publish now" : "Schedule post"}
          </Button>
        </div>
      </section>
      <aside className="preview-panel">
        <div className="preview-title">
          <h2>Video preview</h2>
          <Badge color="gray">Original</Badge>
        </div>
        {video ? (
          <>
            <video
              key={video.id}
              controls
              src={`/api/media/${video.id}/preview`}
              preload="metadata"
            />
            <h3>{video.name}</h3>
            <p className="preview-caption">
              {caption || "Your caption will appear here."}
            </p>
            <div className="preview-meta">
              <span>
                {video.width} × {video.height}
              </span>
              <span>{Math.round(video.duration)} sec</span>
            </div>
          </>
        ) : (
          <div className="preview-empty">
            <VideoIcon width={40} height={40} />
            <p>
              Your video takes
              <br />
              center stage here.
            </p>
          </div>
        )}
        <div className="preview-note">
          <CheckIcon />
          <span>Your original stays in Google Drive.</span>
        </div>
      </aside>
    </div>
  );
}
function Calendar({
  data,
  reload,
}: {
  data: Data;
  reload: () => Promise<void>;
}) {
  const [month, setMonth] = useState(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }),
    [day, setDay] = useState("");
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    offset = (month.getDay() + 6) % 7;
  const dayKey = (d: number) =>
    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <>
      <div className="calendar-toolbar">
        <h2>
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <span className="muted">{zone}</span>
        <Button
          variant="soft"
          aria-label="Previous month"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="soft"
          aria-label="Next month"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div className="calendar-weekday" key={d}>
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div className="calendar-cell blank" key={`blank${i}`} />
        ))}
        {Array.from({ length: end }, (_, i) => i + 1).map((d) => {
          const items = data.posts.filter(
            (p) =>
              p.scheduled_at &&
              formatInTimeZone(p.scheduled_at, zone, "yyyy-MM-dd") ===
                dayKey(d),
          );
          return (
            <button
              key={d}
              className={`calendar-cell ${day === dayKey(d) ? "selected" : ""}`}
              onClick={() => setDay(dayKey(d))}
            >
              <span>{d}</span>
              {items.slice(0, 2).map((p) => (
                <span className="calendar-post" key={p.id}>
                  {p.media_name}
                </span>
              ))}
              {items.length > 2 && <small>+{items.length - 2} more</small>}
            </button>
          );
        })}
      </div>
      {day && (
        <section className="calendar-detail">
          <h2>{day}</h2>
          <PostList
            posts={data.posts.filter(
              (p) =>
                p.scheduled_at &&
                formatInTimeZone(p.scheduled_at, zone, "yyyy-MM-dd") === day,
            )}
            reload={reload}
          />
        </section>
      )}
    </>
  );
}
function Billing({ data }: { data: Data }) {
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  async function go(plan?: string) {
    setBusy(plan || "portal");
    try {
      const r = await api(
        plan ? "billing/checkout" : "billing/portal",
        "POST",
        plan ? { plan } : {},
      );
      location.assign(r.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }
  return (
    <>
      {error && (
        <Callout.Root color="red" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {data.subscription && (
        <div className="subscription-summary">
          <div>
            <h2>{plans[data.subscription.plan].name}</h2>
            <p>
              {data.subscription.status} ·{" "}
              {data.subscription.cancel_at_period_end
                ? "Access ends"
                : "Current period ends"}{" "}
              {date(data.subscription.period_end)}
            </p>
            <p>
              {data.usage.consumed} published · {data.usage.reserved} reserved ·{" "}
              {(
                (Number(data.usage.consumed_bytes || 0) +
                  Number(data.usage.reserved_bytes || 0)) /
                1024 ** 3
              ).toFixed(1)}{" "}
              GB / {plans[data.subscription.plan].bandwidthBytes / 1024 ** 3} GB
              bandwidth
            </p>
          </div>
          <Button variant="soft" disabled={!!busy} onClick={() => go()}>
            Manage billing
          </Button>
        </div>
      )}
      <div className="pricing-grid">
        {Object.entries(plans).map(([id, p]) => (
          <article
            className={`price-card ${id === "creator" ? "featured" : ""}`}
            key={id}
          >
            <h2>{p.name}</h2>
            <div className="price">
              ${p.price}
              <span>/month</span>
            </div>
            <p>{p.accounts} connected social accounts</p>
            <p>{p.posts} destination posts per month</p>
            <p>{p.bandwidthBytes / 1024 ** 3} GB monthly video bandwidth</p>
            <p>
              {p.maxVideoBytes > 2 * 1024 ** 3
                ? "Up to 10 GB videos (YouTube & long-form)"
                : "Up to 2 GB videos"}
            </p>
            <p>Short-form videos up to 500 MB</p>
            <p>Your own Google Drive storage</p>
            <p>All four publishing platforms</p>
            <Button
              size="3"
              variant={id === "creator" ? "solid" : "soft"}
              disabled={!!busy || !data.capabilities.billing}
              onClick={() => go(id)}
            >
              {busy === id ? <Spinner /> : null}
              {data.subscription?.plan === id
                ? "Manage plan"
                : `Choose ${p.name}`}
            </Button>
          </article>
        ))}
      </div>
      <p className="billing-note">
        One video sent to four accounts counts as four posts. Retries do not
        count twice. All checkout sessions use Stripe test mode; no real
        payments are taken.
      </p>
      {!data.capabilities.billing && (
        <Callout.Root>
          <Callout.Text>
            Billing setup is pending. Configure Stripe test credentials and the
            three monthly prices to enable checkout.
          </Callout.Text>
        </Callout.Root>
      )}
    </>
  );
}
function Settings({ data }: { data: Data }) {
  const [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      await api("account", "DELETE", { confirmation });
      await authClient.signOut();
      location.assign("/");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <section className="settings-section">
        <h2>Google sign-in</h2>
        <p>{data.user.name}</p>
        <p>{data.user.email}</p>
        <p className="muted">
          Connecting a different Drive or YouTube account does not change your
          sign-in identity.
        </p>
        <Button variant="soft" onClick={() => authClient.signOut()}>
          Sign out
        </Button>
      </section>
      <section className="settings-section">
        <h2>Delete your account</h2>
        <p>
          This removes your app records and cancels your subscription. Original
          videos in Google Drive and posts already published on social platforms
          remain there.
        </p>
        <label className="field">
          Type DELETE to confirm
          <TextField.Root
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
          />
        </label>
        <Button
          color="red"
          disabled={confirmation !== "DELETE" || busy}
          onClick={remove}
        >
          {busy ? <Spinner /> : null}Delete account
        </Button>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
      </section>
      <div className="legal-links">
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/terms">Terms of service</Link>
        <Link href="/data-deletion">Data deletion</Link>
      </div>
    </>
  );
}
