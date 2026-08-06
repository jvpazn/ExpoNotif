import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [token, setToken] = useState("");
  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("Iniciando...");

  useEffect(() => {
    obterToken();
  }, []);

  async function obterToken() {
    try {
      setStatus("Verificando dispositivo...");

      if (!Device.isDevice) {
        setErro("Use um dispositivo físico.");
        return;
      }

      setStatus("Solicitando permissões...");

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } =
          await Notifications.requestPermissionsAsync();

        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setErro("Permissão de notificação negada.");
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

      if (!projectId) {
        setErro(
          "ProjectId não encontrado. Verifique o app.json."
        );
        return;
      }

      setStatus("Obtendo token...");

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setToken(pushToken.data);
      setStatus("Token obtido com sucesso!");

      console.log("EXPO PUSH TOKEN:");
      console.log(pushToken.data);
    } catch (e) {
      console.log(e);
      setErro(JSON.stringify(e, null, 2));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>
        Expo Push Token
      </Text>

      <Text style={styles.label}>
        Status:
      </Text>

      <Text style={styles.texto}>
        {status}
      </Text>

      <Text style={styles.label}>
        Token:
      </Text>

      <Text selectable style={styles.token}>
        {token || "Nenhum token encontrado"}
      </Text>

      {erro ? (
        <>
          <Text style={styles.label}>
            Erro:
          </Text>

          <Text style={styles.erro}>
            {erro}
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
  },
  texto: {
    fontSize: 14,
  },
  token: {
    fontSize: 12,
    marginTop: 10,
  },
  erro: {
    color: "red",
    marginTop: 10,
  },
});