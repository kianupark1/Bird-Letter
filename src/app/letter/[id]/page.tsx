"use client";
import { useParams } from "next/navigation";
import LetterView from "@/components/LetterView";

export default function LetterPage() {
  const { id } = useParams<{ id: string }>();
  return <LetterView id={id} />;
}
