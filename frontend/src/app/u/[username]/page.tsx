"use client";

import { useParams, redirect } from "next/navigation";

export default function PublicProfileRedirect() {
  const params = useParams();
  const username = params.username as string;
  redirect(`/profile/${username}`);
}
