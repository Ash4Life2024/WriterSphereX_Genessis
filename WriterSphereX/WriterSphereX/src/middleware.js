import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "7eaa85b3-e981-4753-998f-d7274f079296");
  requestHeaders.set("x-createxyz-project-group-id", "8b7674ab-63f6-42d3-b338-18a5dadd9a5d");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}