"use client";
import { useParams } from "next/navigation";
import LetterView from "@/components/LetterView";
import OpenInApp from "@/components/OpenInApp";

export default function LetterPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <OpenInApp id={id} />
      <LetterView id={id} />
    </>
  );
}
