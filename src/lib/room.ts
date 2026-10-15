/** 대화방 주소: 친구는 ?u=<uid>, 이름만 아는 사람은 ?n=<이름> */
export const roomHref = (t: { uid?: string; name: string }) => (t.uid ? `/room?u=${encodeURIComponent(t.uid)}` : `/room?n=${encodeURIComponent(t.name)}`);
