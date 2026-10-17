/**
 * Round 4: the single "Adult" switch (Settings). Default OFF. When ON it unlocks all mature content:
 * nudity on unarmoured party members (simple low-res bodies, non-sexual, adults only – never NPC children),
 * gore in battle (blood bursts instead of sparks) and, in future rounds, crude humour / dark story variants.
 */
export const Mature = {
  get on() { try { return localStorage.getItem('ember_adult') === '1'; } catch { return false; } },
  set(v: boolean) { try { localStorage.setItem('ember_adult', v ? '1' : '0'); } catch { /* ignore */ } },
};
