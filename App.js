import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [token, setToken] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("Iniciando...");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obterToken();

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0057D9",
      });
    }
  }, []);

  async function obterToken() {
    try {
      setErro("");
      setStatus("Verificando dispositivo...");

      if (!Device.isDevice) {
        setErro("Use um dispositivo físico.");
        setStatus("Erro");
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
        setStatus("Permissão negada");
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

      if (!projectId) {
        setErro(
          "ProjectId não encontrado. Verifique o app.json/app.config.js."
        );
        setStatus("Erro");
        return;
      }

      setStatus("Obtendo token...");

      const pushToken =
        await Notifications.getExpoPushTokenAsync({
          projectId,
        });

      setToken(pushToken.data);
      setStatus("Token obtido com sucesso!");

      console.log("EXPO PUSH TOKEN:");
      console.log(pushToken.data);
    } catch (e) {
      console.log(e);

      setStatus("Erro ao obter token");
      setErro(
        e?.message || "Não foi possível obter o token."
      );
    }
  }

  async function enviarNotificacao() {
    if (!token.trim()) {
      Alert.alert(
        "Atenção",
        "Digite o Expo Push Token do dispositivo."
      );
      return;
    }

    if (!mensagem.trim()) {
      Alert.alert(
        "Atenção",
        "Digite uma mensagem."
      );
      return;
    }

    try {
      setEnviando(true);

      const resposta = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",

          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            to: token.trim(),

            sound: "default",

            title: titulo.trim() || "Nova notificação",

            body: mensagem.trim(),

            data: {
              origem: "painel",
            },
          }),
        }
      );

      const resultado = await resposta.json();

      console.log("Resposta do Expo:");
      console.log(resultado);

      if (!resposta.ok) {
        throw new Error(
          resultado?.errors?.[0]?.message ||
          "Erro ao enviar a notificação."
        );
      }

      Alert.alert(
        "Sucesso",
        "Notificação enviada!"
      );

      setTitulo("");
      setMensagem("");
    } catch (error) {
      console.log("Erro:", error);

      Alert.alert(
        "Erro",
        error?.message ||
          "Não foi possível enviar a notificação."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0758C9"
      />

      {/* Cabeçalho azul */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Enviar Notificação
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* TOKEN */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Token do dispositivo
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={token}
              onChangeText={setToken}
              placeholder="ExponentPushToken[...]"
              placeholderTextColor="#7B849A"
              style={[
                styles.input,
                styles.tokenInput,
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={false}
              selectable
            />

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                Alert.alert(
                  "Leitor de Token",
                  "Aqui você pode integrar um leitor de QR Code."
                );
              }}
            >
              <Ionicons
                name="scan-outline"
                size={25}
                color="#7A8397"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.helper}>
            Cole o Expo Push Token do dispositivo que irá
            receber a notificação.
          </Text>
        </View>

        {/* TÍTULO */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Título
          </Text>

          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Promoção Especial"
            placeholderTextColor="#7B849A"
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={styles.helper}>
            Título que aparecerá na notificação.
          </Text>
        </View>

        {/* MENSAGEM */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Mensagem
          </Text>

          <TextInput
            value={mensagem}
            onChangeText={setMensagem}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#7B849A"
            style={[
              styles.input,
              styles.messageInput,
            ]}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.helper}>
            Mensagem que será enviada na notificação.
          </Text>
        </View>

        {/* BOTÃO */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            enviando && styles.sendButtonDisabled,
          ]}
          onPress={enviarNotificacao}
          disabled={enviando}
          activeOpacity={0.8}
        >
          <Ionicons
            name="paper-plane"
            size={24}
            color="#FFFFFF"
          />

          <Text style={styles.sendButtonText}>
            {enviando
              ? "Enviando..."
              : "Enviar Notificação"}
          </Text>
        </TouchableOpacity>

        {/* Status */}
        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        ) : null}

        {status ? (
          <Text style={styles.status}>
            {status}
          </Text>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 105,
    backgroundColor: "#0758C9",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 16,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    paddingHorizontal: 32,
    paddingTop: 30,
  },

  fieldContainer: {
    marginBottom: 29,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  input: {
    width: "100%",
    height: 53,
    borderWidth: 1,
    borderColor: "#C7CEDB",
    borderRadius: 8,
    paddingHorizontal: 20,
    color: "#202A3A",
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },

  tokenInput: {
    paddingRight: 58,
  },

  iconButton: {
    position: "absolute",
    right: 13,
    height: 45,
    width: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  messageInput: {
    height: 248,
    paddingTop: 17,
    paddingBottom: 17,
  },

  helper: {
    color: "#606A80",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },

  sendButton: {
    height: 59,
    backgroundColor: "#0758C9",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 16,

    shadowColor: "#0758C9",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,

    elevation: 3,
  },

  sendButtonDisabled: {
    opacity: 0.65,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },

  errorBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 13,
  },

  status: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },

  bottomSpace: {
    height: 30,
  },
});
