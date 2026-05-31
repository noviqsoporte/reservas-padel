"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
    id: string;
    nombre: string | null;
    email: string | null;
    telefono: string | null;
}

export function useSession() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        if (!userId) return;
        const supabase = createClient();
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
        if (data === null) {
            setProfile(null);
            setLoading(false);
            return;
        }
        setProfile(data);
        setLoading(false);
    };

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error || !session) {
                if (error) supabase.auth.signOut();
                setUser(null);
                setLoading(false);
                return;
            }
            setUser(session.user);
            fetchProfile(session.user.id).finally(() => setLoading(false));
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
                setUser(null);
                setProfile(null);
                return;
            }
            setUser(session?.user ?? null);
            if (event === 'SIGNED_IN' && session?.user?.id) {
                fetchProfile(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, profile, loading, signOut };
}
