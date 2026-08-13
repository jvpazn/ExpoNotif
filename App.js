import React, { useEffect, useState } from "react";

import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  Ionicons,
} from "@expo/vector-icons";

const SUPABASE_URL =
  "https://cgdkhufktnclezagrhek.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_IPsf8cTazQXIOxTS-EvkdQ_G7bVSGCj";

const API_USUARIO =
  `${SUPABASE_URL}/rest/v1/usuario`;


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


async function obterExpoPushToken() {

  if (!Device.isDevice) {
    throw new Error(
      "As notificações push precisam ser testadas em um dispositivo físico."
    );
  }


  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "default",
      {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3F6FE5",
      }
    );
  }

  const {
    status: existingStatus,
  } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {

    const {
      status,
    } = await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    throw new Error(
      "Permissão para notificações foi negada."
    );
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  if (!projectId) {
    throw new Error(
      "ProjectId não encontrado. Configure o app.json."
    );
  }

  const token =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  return token.data;
}


function AppIcon() {
  return (
    <View style={styles.appIcon}>
      <Ionicons
        name="notifications-outline"
        size={28}
        color="#FFFFFF"
      />
    </View>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  icon,
  editable = true,
}) {

  return (
    <View style={styles.fieldContainer}>

      <Text style={styles.label}>
        {label}
      </Text>

      <View style={[
        styles.inputContainer,
        !editable && styles.inputDisabled,
      ]}>

        {icon && (
          <Ionicons
            name={icon}
            size={17}
            color="#9AA0A6"
            style={styles.inputIcon}
          />
        )}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B7BCC5"
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          editable={editable}
        />

      </View>

    </View>
  );
}

function CadastroScreen({ navigation }) {

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [token, setToken] = useState("");

  const [carregandoToken, setCarregandoToken] =
    useState(true);

  const [cadastrando, setCadastrando] =
    useState(false);

  useEffect(() => {

    carregarToken();

  }, []);


  async function carregarToken() {

    try {

      setCarregandoToken(true);

      const pushToken =
        await obterExpoPushToken();

      setToken(pushToken);

      console.log(
        "EXPO PUSH TOKEN:",
        pushToken
      );

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Notificação",
        error.message
      );

    } finally {

      setCarregandoToken(false);

    }

  }


  async function cadastrar() {

    const nomeTratado = nome.trim();
    const emailTratado = email.trim().toLowerCase();
    const senhaTratada = senha.trim();


    if (!nomeTratado) {

      Alert.alert(
        "Erro",
        "Digite seu nome."
      );

      return;
    }


    if (!emailTratado) {

      Alert.alert(
        "Erro",
        "Digite seu e-mail."
      );

      return;
    }


    if (!emailTratado.includes("@")) {

      Alert.alert(
        "Erro",
        "Digite um e-mail válido."
      );

      return;
    }


    if (senhaTratada.length < 6) {

      Alert.alert(
        "Erro",
        "A senha precisa ter pelo menos 6 caracteres."
      );

      return;
    }


    if (!token) {

      Alert.alert(
        "Erro",
        "Não foi possível obter o token de notificação."
      );

      return;
    }


    try {

      setCadastrando(true);

      const verificarResponse =
        await fetch(
          `${API_USUARIO}?email=eq.${encodeURIComponent(
            emailTratado
          )}&select=id`,
          {
            method: "GET",

            headers: {
              apikey: SUPABASE_KEY,
            },
          }
        );


      if (!verificarResponse.ok) {

        throw new Error(
          "Não foi possível verificar o e-mail."
        );

      }


      const existentes =
        await verificarResponse.json();


      if (existentes.length > 0) {

        Alert.alert(
          "Cadastro",
          "Esse e-mail já está cadastrado."
        );

        return;
      }
      const response =
        await fetch(
          API_USUARIO,
          {
            method: "POST",

            headers: {
              apikey: SUPABASE_KEY,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },

            body: JSON.stringify({
              nome: nomeTratado,
              email: emailTratado,
              senha: senhaTratada,
              token: token,
            }),
          }
        );


      if (!response.ok) {

        const erro =
          await response.text();

        console.log(
          "Erro Supabase:",
          erro
        );

        throw new Error(
          "Não foi possível cadastrar o usuário."
        );

      }


      Alert.alert(
        "Sucesso!",
        "Usuário cadastrado com sucesso.",
        [
          {
            text: "Ir para Login",
            onPress: () =>
              navigation.navigate("Login"),
          },
        ]
      );


      setNome("");
      setEmail("");
      setSenha("");

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        error.message
      );

    } finally {

      setCadastrando(false);

    }

  }


  return (

    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.card}>

          <AppIcon />

          <Text style={styles.title}>
            Cadastro
          </Text>

          <Text style={styles.subtitle}>
            Crie sua conta para começar
          </Text>


          <Campo
            label="Nome"
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome"
            icon="person-outline"
          />


          <Campo
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            icon="mail-outline"
          />


          <Campo
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            secureTextEntry
            icon="lock-closed-outline"
          />


          <Campo
            label="Token do aparelho"
            value={
              carregandoToken
                ? "Obtendo token..."
                : token
            }
            placeholder="Token do dispositivo"
            icon="notifications-outline"
            editable={false}
          />


          <View style={styles.infoBox}>

            <Ionicons
              name="information-circle-outline"
              size={15}
              color="#6E7781"
            />

            <Text style={styles.infoText}>
              O token será obtido automaticamente
              pelo aplicativo.
            </Text>

          </View>


          <TouchableOpacity
            style={[
              styles.primaryButton,
              cadastrando &&
                styles.buttonDisabled,
            ]}
            onPress={cadastrar}
            disabled={cadastrando}
          >

            {cadastrando ? (

              <ActivityIndicator
                color="#FFFFFF"
              />

            ) : (

              <Text style={styles.primaryButtonText}>
                Cadastrar
              </Text>

            )}

          </TouchableOpacity>


          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Login")
            }
          >

            <Text style={styles.bottomText}>
              Já tem conta?{" "}
              <Text style={styles.link}>
                Entrar
              </Text>
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>

  );
}


function LoginScreen({ navigation }) {

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [entrando, setEntrando] =
    useState(false);


  async function fazerLogin() {

    const emailTratado =
      email.trim().toLowerCase();

    const senhaTratada =
      senha.trim();


    if (!emailTratado || !senhaTratada) {

      Alert.alert(
        "Erro",
        "Preencha e-mail e senha."
      );

      return;
    }


    try {

      setEntrando(true);


      const url =
        `${API_USUARIO}` +
        `?email=eq.${encodeURIComponent(emailTratado)}` +
        `&senha=eq.${encodeURIComponent(senhaTratada)}` +
        `&select=id,nome,email,token`;


      console.log(
        "Consultando:",
        url
      );


      const response =
        await fetch(
          url,
          {
            method: "GET",

            headers: {
              apikey: SUPABASE_KEY,
            },
          }
        );


      if (!response.ok) {

        throw new Error(
          "Erro ao consultar o banco de dados."
        );

      }


      const usuarios =
        await response.json();


      if (usuarios.length > 0) {

        const usuario =
          usuarios[0];


        navigation.replace(
          "Mensagem",
          {
            usuarioLogado: usuario,
          }
        );


      } else {

        Alert.alert(
          "Login",
          "E-mail ou senha incorretos."
        );

      }


    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        error.message
      );

    } finally {

      setEntrando(false);

    }

  }


  return (

    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.card}>

          <AppIcon />

          <Text style={styles.title}>
            Login
          </Text>

          <Text style={styles.subtitle}>
            Acesse sua conta
          </Text>


          <Campo
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            icon="mail-outline"
          />


          <Campo
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            secureTextEntry
            icon="lock-closed-outline"
          />


          <TouchableOpacity
            style={styles.forgotButton}
          >

            <Text style={styles.forgotText}>
              Esqueceu sua senha?
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.primaryButton,
              entrando &&
                styles.buttonDisabled,
            ]}
            onPress={fazerLogin}
            disabled={entrando}
          >

            {entrando ? (

              <ActivityIndicator
                color="#FFFFFF"
              />

            ) : (

              <Text style={styles.primaryButtonText}>
                Entrar
              </Text>

            )}

          </TouchableOpacity>


          <Text style={styles.bottomText}>
            Não tem uma conta?{" "}

            <Text
              style={styles.link}
              onPress={() =>
                navigation.navigate("Cadastro")
              }
            >
              Criar conta
            </Text>

          </Text>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>

  );
}

function MensagemScreen({ navigation }) {

  const [usuarios, setUsuarios] =
    useState([]);

  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState(null);

  const [titulo, setTitulo] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [dropdownAberto, setDropdownAberto] =
    useState(false);


  useEffect(() => {

    carregarUsuarios();

  }, []);


  async function carregarUsuarios() {

    try {

      setCarregando(true);


      const response =
        await fetch(
          `${API_USUARIO}?select=id,nome,email,token&order=nome.asc`,
          {
            method: "GET",

            headers: {
              apikey: SUPABASE_KEY,
            },
          }
        );


      if (!response.ok) {

        throw new Error(
          "Não foi possível carregar os usuários."
        );

      }


      const dados =
        await response.json();


      setUsuarios(dados);


    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        error.message
      );

    } finally {

      setCarregando(false);

    }

  }

  async function enviarNotificacao() {

    if (!usuarioSelecionado) {

      Alert.alert(
        "Erro",
        "Selecione um usuário."
      );

      return;
    }


    if (!titulo.trim()) {

      Alert.alert(
        "Erro",
        "Digite o título da notificação."
      );

      return;
    }


    if (!mensagem.trim()) {

      Alert.alert(
        "Erro",
        "Digite a mensagem."
      );

      return;
    }


    if (!usuarioSelecionado.token) {

      Alert.alert(
        "Erro",
        "Esse usuário não possui token de notificação."
      );

      return;
    }


    try {

      setEnviando(true);


      const response =
        await fetch(
          "https://exp.host/--/api/v2/push/send",
          {
            method: "POST",

            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              to: usuarioSelecionado.token,

              sound: "default",

              title: titulo.trim(),

              body: mensagem.trim(),

              data: {
                enviadoPeloApp: true,
              },
            }),
          }
        );


      const resultado =
        await response.json();


      console.log(
        "Resposta Expo:",
        resultado
      );


      if (!response.ok) {

        throw new Error(
          "Erro ao enviar a notificação."
        );

      }


      if (
        resultado.data &&
        resultado.data.status === "error"
      ) {

        throw new Error(
          resultado.data.message ||
          "O Expo recusou a notificação."
        );

      }


      setTitulo("");
      setMensagem("");


    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        error.message
      );

    } finally {

      setEnviando(false);

    }

  }


  return (

    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={styles.messageScroll}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.messageCard}>

          {/* CABEÇALHO */}

          <View style={styles.messageHeader}>

            <TouchableOpacity
              onPress={() =>
                navigation.goBack()
              }
              style={styles.backButton}
            >

              <Ionicons
                name="arrow-back"
                size={22}
                color="#202124"
              />

            </TouchableOpacity>


            <View>

              <Text style={styles.messageTitle}>
                Enviar Notificação
              </Text>

              <Text style={styles.messageSubtitle}>
                Envie uma notificação push para um usuário
              </Text>

            </View>

          </View>


          {/* USUÁRIO */}

          <Text style={styles.label}>
            Selecionar usuário
          </Text>


          <TouchableOpacity
            style={styles.select}
            onPress={() =>
              setDropdownAberto(
                !dropdownAberto
              )
            }
          >

            <Ionicons
              name="person-outline"
              size={17}
              color="#9AA0A6"
            />


            <Text
              style={[
                styles.selectText,
                !usuarioSelecionado &&
                  styles.placeholder,
              ]}
            >

              {usuarioSelecionado
                ? usuarioSelecionado.nome
                : carregando
                  ? "Carregando usuários..."
                  : "Escolha um usuário"}

            </Text>


            <Ionicons
              name={
                dropdownAberto
                  ? "chevron-up"
                  : "chevron-down"
              }
              size={18}
              color="#777"
            />

          </TouchableOpacity>


          {/* DROPDOWN */}

          {dropdownAberto && (

            <View style={styles.dropdown}>

              {usuarios.length === 0 ? (

                <Text style={styles.emptyText}>
                  Nenhum usuário cadastrado.
                </Text>

              ) : (

                usuarios.map((usuario) => (

                  <TouchableOpacity
                    key={String(usuario.id)}
                    style={styles.dropdownItem}
                    onPress={() => {

                      setUsuarioSelecionado(
                        usuario
                      );

                      setDropdownAberto(
                        false
                      );

                    }}
                  >

                    <Ionicons
                      name="person-circle-outline"
                      size={19}
                      color="#6D7580"
                    />

                    <View style={styles.userInfo}>

                      <Text style={styles.userName}>
                        {usuario.nome}
                      </Text>

                      <Text style={styles.userEmail}>
                        {usuario.email}
                      </Text>

                    </View>

                  </TouchableOpacity>

                ))

              )}

            </View>

          )}


          {/* TÍTULO */}

          <Text style={styles.label}>
            Título
          </Text>


          <View style={styles.inputContainer}>

            <Ionicons
              name="text-outline"
              size={17}
              color="#9AA0A6"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Digite o título da notificação"
              placeholderTextColor="#B7BCC5"
              maxLength={80}
            />

          </View>


          {/* MENSAGEM */}

          <View style={styles.messageLabelRow}>

            <Text style={styles.label}>
              Mensagem
            </Text>

            <Text style={styles.counter}>
              {mensagem.length}/200
            </Text>

          </View>


          <View style={[
            styles.inputContainer,
            styles.messageInputContainer,
          ]}>

            <TextInput
              style={[
                styles.input,
                styles.messageInput,
              ]}
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Digite a mensagem da notificação"
              placeholderTextColor="#B7BCC5"
              multiline
              maxLength={200}
              textAlignVertical="top"
            />

          </View>


          {/* INFORMAÇÃO */}

          <View style={styles.infoNotification}>

            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#4974D8"
            />

            <Text style={styles.infoNotificationText}>
              O token será usado automaticamente
              para enviar a notificação.
            </Text>

          </View>


          {/* BOTÃO */}

          <TouchableOpacity
            style={[
              styles.sendButton,
              enviando &&
                styles.buttonDisabled,
            ]}
            onPress={enviarNotificacao}
            disabled={enviando}
          >

            {enviando ? (

              <ActivityIndicator
                color="#FFFFFF"
              />

            ) : (

              <>

                <Ionicons
                  name="send"
                  size={17}
                  color="#FFFFFF"
                />

                <Text style={styles.sendButtonText}>
                  Enviar notificação
                </Text>

              </>

            )}

          </TouchableOpacity>


        </View>

      </ScrollView>

    </KeyboardAvoidingView>

  );
}

const Stack =
  createNativeStackNavigator();


export default function App() {

  return (

    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Cadastro"
        screenOptions={{
          headerShown: false,
        }}
      >

        <Stack.Screen
          name="Cadastro"
          component={CadastroScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Mensagem"
          component={MensagemScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>

  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  messageScroll: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 45,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 15,

    elevation: 5,
  },


  messageCard: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 15,

    elevation: 4,
  },


  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#3F6FE5",

    alignItems: "center",
    justifyContent: "center",

    alignSelf: "center",

    marginBottom: 12,
  },



  title: {
    textAlign: "center",
    color: "#202124",
    fontSize: 24,
    fontWeight: "700",
  },

  subtitle: {
    textAlign: "center",
    color: "#777E87",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 22,
  },

  label: {
    color: "#40454D",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },

  fieldContainer: {
    marginBottom: 3,
  },

  inputContainer: {
    height: 43,
    borderWidth: 1,
    borderColor: "#E0E3E8",
    borderRadius: 7,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",
  },

  inputDisabled: {
    backgroundColor: "#F6F7F9",
  },

  inputIcon: {
    marginLeft: 11,
    marginRight: 7,
  },

  input: {
    flex: 1,
    height: "100%",

    color: "#292D32",
    fontSize: 12,

    paddingHorizontal: 5,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F1F4F8",

    borderRadius: 6,

    paddingHorizontal: 10,
    paddingVertical: 8,

    marginTop: 8,
    marginBottom: 10,
  },

  infoText: {
    color: "#707780",
    fontSize: 10,
    marginLeft: 6,
    flex: 1,
  },

  primaryButton: {
    height: 43,

    backgroundColor: "#3F6FE5",

    borderRadius: 6,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 5,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  bottomText: {
    textAlign: "center",

    color: "#7B8189",

    fontSize: 11,

    marginTop: 14,
  },

  link: {
    color: "#3266D5",
    fontWeight: "600",
  },


  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginBottom: 5,
  },

  forgotText: {
    color: "#3769D4",
    fontSize: 9,
    fontWeight: "500",
  },


  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backButton: {
    width: 35,
    height: 35,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 8,
  },

  messageTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#202124",
  },

  messageSubtitle: {
    fontSize: 10,
    color: "#858B94",
    marginTop: 2,
  },

  select: {
    minHeight: 43,

    borderWidth: 1,
    borderColor: "#E0E3E8",

    borderRadius: 7,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,

    backgroundColor: "#FFFFFF",
  },

  selectText: {
    flex: 1,

    color: "#292D32",

    fontSize: 12,

    marginLeft: 8,
  },

  placeholder: {
    color: "#B7BCC5",
  },



  dropdown: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E0E3E8",

    borderRadius: 7,

    marginTop: 4,

    overflow: "hidden",

    elevation: 5,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  dropdownItem: {
    minHeight: 48,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,

    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F3",
  },

  userInfo: {
    marginLeft: 9,
    flex: 1,
  },

  userName: {
    fontSize: 12,
    color: "#30343A",
    fontWeight: "600",
  },

  userEmail: {
    fontSize: 9,
    color: "#8A9098",
    marginTop: 2,
  },

  emptyText: {
    padding: 15,
    textAlign: "center",
    color: "#888",
    fontSize: 11,
  },


  messageLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  counter: {
    color: "#9298A0",
    fontSize: 9,
    marginTop: 10,
  },

  messageInputContainer: {
    height: 110,
    alignItems: "flex-start",
  },

  messageInput: {
    paddingTop: 11,
    paddingBottom: 10,
  },


  infoNotification: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#EEF3FF",

    borderRadius: 7,

    padding: 10,

    marginTop: 13,
  },

  infoNotificationText: {
    color: "#62749B",
    fontSize: 10,
    marginLeft: 7,
    flex: 1,
  },

  sendButton: {
    height: 45,

    backgroundColor: "#3F6FE5",

    borderRadius: 7,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 13,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 7,
  },

});
