import { redirect } from "next/navigation";

export default function Home() {
  redirect("/admin-guru");
  return <>Coming Soon</>;
}
