import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  user_id: string;
  created_at: string | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

export const TransactionList = ({
  transactions,
  onUpdate,
}: TransactionListProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus",
      });
      onUpdate();
    }
    setDeleteId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Riwayat Transaksi</CardTitle>
        <CardDescription>Transaksi bulan ini</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada transaksi bulan ini
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {transaction.type === "income" ? (
                    <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-success" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.category}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.transaction_date)}
                    </p>
                    {transaction.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={`font-semibold ${
                      transaction.type === "income"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}Rp{" "}
                    {Number(transaction.amount).toLocaleString("id-ID")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(transaction.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
