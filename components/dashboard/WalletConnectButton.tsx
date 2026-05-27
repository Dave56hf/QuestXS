"use client";

import { useRef, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Wallet } from "lucide-react";

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
  isCompleted?: boolean;
}

export default function WalletConnectButton({
  onConnect,
  isCompleted = false,
}: WalletConnectButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const submittedAddress = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (address && onConnect) {
      if (submittedAddress.current === address) {
        return;
      }

      submittedAddress.current = address;
      onConnect(address);
    }
  }, [address, onConnect]);

  async function connectWallet() {
    setError("");

    const ethereum = (
      window as typeof window & {
        ethereum?: {
          request: (args: {
            method: "eth_requestAccounts";
          }) => Promise<string[]>;
        };
      }
    ).ethereum;

    if (!ethereum) {
      setError("No wallet found.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const nextAddress = accounts[0];

      if (!nextAddress) {
        setError("No wallet account selected.");
        return;
      }

      setAddress(nextAddress);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError("Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  }

  if (!mounted) {
    return null;
  }

  if (isCompleted || address) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted">
          {address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "Connected"}
        </span>
        <span className="inline-block h-2 w-2 rounded-full bg-accent" />
        <span className="font-mono text-xs text-accent">
          Wallet Verified
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="primary"
        className="text-xs"
        disabled={isConnecting}
        onClick={connectWallet}
      >
        <Wallet className="mr-1 inline h-3 w-3" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
      {error && <span className="font-mono text-xs text-danger">{error}</span>}
    </div>
  );
}
