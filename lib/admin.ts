export function getAdminWallets(): string[] {
  const single = process.env.ADMIN_WALLET?.toLowerCase();
  const many = process.env.ADMIN_WALLETS
    ? process.env.ADMIN_WALLETS.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean)
    : [];
  const set = new Set<string>();
  if (single) set.add(single);
  for (const w of many) set.add(w);
  return Array.from(set);
}

export function isAdminWallet(wallet?: string | null): boolean {
  if (!wallet) return false;
  const admins = getAdminWallets();
  return admins.includes(wallet.toLowerCase());
}



