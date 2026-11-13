/** 대화방 주소: 친구는 ?u=<uid>, 이름만 아는 사람은 ?n=<이름> */
export const roomHref = (t: { uid?: string; name: string; key?: string }) => (t.key?.startsWith("p:") ? `/room?p=${encodeURIComponent(t.key.slice(2))}` : t.uid ? `/room?u=${encodeURIComponent(t.uid)}` : `/room?n=${encodeURIComponent(t.name)}`);
