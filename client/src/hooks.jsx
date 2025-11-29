import { useEffect } from "react";
import { getCookie, post } from "./functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePost(url, body, key, options = {}) {
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: [key, body],
    queryFn: async () => {
      console.log("usePost fetching:", url, body);
      return await post(url, body, `useQuery ${key}`);
    },
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60, // cache valid for 1 minute
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [key, body] });

  return { data, error, isLoading, invalidate };
}

export function useMutatePost(invalidateKey) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ url, body, key }) => {
      return await post(url, body, key);
    },
    onSuccess: () => {
      if (invalidateKey)
        queryClient.invalidateQueries({ queryKey: [invalidateKey] });
    },
  });

  return mutation;
}

//checks if user is privileged to the page
export function useCheckUser() {
  const url = window.location.href;
  let privilege = 0;
  if (url.includes("beheer/")) privilege = 2;
  else if (url.includes("leerkracht/")) privilege = 1;

  const sessionid = getCookie("sessionId");
  const userid = getCookie("userId");
  const body = { sessionid, userid };

  // Use a stable key + only run once userid exists
  const { data: user, isLoading } = usePost(
    "/api/getUser",
    body,
    "getUser",
    { enabled: !!userid }
  );

  useEffect(() => {
    if (!userid) return; // prevent running early

    if (!user && !isLoading) {
      alert("Gebruiker niet gevonden of niet ingelogd.");
      window.location.replace("../#");
      return;
    }
    else if (user) {
      if (user.privilege == null && privilege === 0) return;

      if (user.privilege < privilege) {
        alert("Je bent niet gemachtigd om deze pagina te bezoeken.");
        window.location.replace("../#");
      }
    }
  }, [isLoading, user, privilege, userid]);
}

