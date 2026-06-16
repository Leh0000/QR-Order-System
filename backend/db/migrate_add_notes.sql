-- Run this if the orders table was created before the notes column was added
ALTER TABLE mini_qr_ordering_system.orders
  ADD COLUMN notes TEXT NULL
  AFTER order_status;
