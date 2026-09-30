"use client";
import { useState } from "react";
import { BIRDS } from "@/lib/birds";
import { ROUTES } from "@/lib/routes";
import { formatMinutes, travelMinutes } from "@/lib/geo";

export default function BirdPicker() {
  const [routeId, setRouteId] = useState(ROUTES[0].id);
  const [birdId, setBirdId] = useState("swallow");
  const route = ROUTES.find((r) => r.id === routeId)!;
  const bird = BIRDS.find((b) => b.id === birdId)!;

  return (
    <>
      <div className="chips">
        {ROUTES.map((r) => (
          <button key={r.id} className="chip" aria-pressed={r.id === routeId} onClick={() => setRouteId(r.id)}>
            {r.title}
          </button>
        ))}
      </div>
      <p className="sub">{route.points.map((p) => p.name).join(" → ")} · {route.km}km</p>

      {BIRDS.map((b) => (
        <button key={b.id} className="card" aria-pressed={b.id === birdId} onClick={() => setBirdId(b.id)}>
          <div>
            <div><span className="name">{b.name}</span><span className="badge">{b.badge}</span></div>
            <div className="note">{b.note}</div>
          </div>
          <div className="time">{formatMinutes(travelMinutes(b, route.km))}</div>
        </button>
      ))}

      <button className="cta">{bird.name}로 보내기 · {formatMinutes(travelMinutes(bird, route.km))} 뒤 도착</button>
    </>
  );
}
