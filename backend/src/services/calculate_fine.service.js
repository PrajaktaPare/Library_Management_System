const finePerDay = Number(process.env.FINE_PER_DAY) || 5;

export const calculateFine = dueDate => {
  const now = new Date();
  const due = new Date(dueDate);

  const diffTime = now - due;

  const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (overdueDays <= 0) {
    return 0;
  }

  return overdueDays * finePerDay;
};
