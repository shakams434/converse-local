# AI LLM Assistant - Asistente Bancario Offline

Una aplicación móvil híbrida construida con React + Capacitor que funciona como un "contenedor de modelos" offline para ejecutar modelos LLM localmente.

## 🎯 Características Principales

- **Gestión de Modelos**: Importa y gestiona archivos .gguf en el dispositivo
- **Motor LLM Local**: Interfaz para conectar con llama.cpp (actualmente con mock)
- **Chat Inteligente**: Interface de chat con streaming de respuestas en tiempo real
- **Configuración Avanzada**: System prompts personalizables y parámetros del motor
- **100% Offline**: No requiere conexión a internet para funcionar
- **Móvil Nativo**: Funciona en Android e iOS como app nativa

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Tema oscuro optimizado
- **Estado**: Zustand con persistencia
- **Móvil**: Capacitor para iOS/Android
- **Navegación**: Tabs nativas con React Router

### Estructura del Proyecto
```
src/
├── components/          # Pantallas principales
│   ├── NavigationTabs.tsx
│   ├── ModelManagerScreen.tsx
│   ├── ChatScreen.tsx
│   └── SettingsScreen.tsx
├── store/              # Estado global (Zustand)
│   └── llmStore.ts
├── modules/local-llm/  # Interface del Motor LLM
│   ├── types.ts        # Interfaces TypeScript
│   ├── mock.ts         # Implementación mock
│   └── index.ts        # Factory y exports
├── utils/              # Utilidades
│   └── fileUtils.ts    # Gestión de archivos
└── pages/              # Rutas principales
    ├── Index.tsx
    └── NotFound.tsx
```

## 📱 Pantallas

### 1. Gestor de Modelos (`ModelManagerScreen`)
- **Importar Modelos**: Selecciona archivos .gguf del dispositivo
- **Configuración**: nCtx (contexto) y nThreads (hilos de procesamiento)
- **Estado del Motor**: Idle → Loading → Ready → Error
- **Control**: Cargar/Recargar modelo en memoria

### 2. Chat (`ChatScreen`)
- **Interface de Chat**: Burbujas usuario/asistente con timestamps
- **Streaming**: Respuestas en tiempo real token por token
- **Controles**: Stop generación, Reset conversación
- **Estado Visual**: Indicadores de estado del motor

### 3. Configuración (`SettingsScreen`)
- **System Prompt**: Instrucciones que definen el comportamiento del AI
- **Configuración**: Forzar respuestas en español
- **Aplicar al Motor**: Sincronizar configuración con el motor LLM

## 🔧 Native Module Interface

El proyecto incluye una interfaz completa para el Native Module que se conectará con llama.cpp:

```typescript
interface LocalLLM {
  loadModel(path: string, opts?: ModelLoadOptions): Promise<boolean>;
  setSystemPrompt(prompt: string): Promise<void>;
  generate(input: string, opts?: GenerationOptions): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  getStatus(): Promise<EngineStatus>;
  addTokenListener(callback: TokenListener): () => void;
}
```

### Mock Implementation
- Simula carga de modelos con delays realistas
- Streaming de tokens con timing variable
- Respuestas bancarias predefinidas para testing
- Control completo de start/stop/reset

## 🚀 Cómo Ejecutar

### Desarrollo Web
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Mobile Deployment con Capacitor

Esta app está optimizada para dispositivos móviles usando Capacitor. Sigue estos pasos para ejecutar en Android/iOS:

#### Prerrequisitos
- Node.js y npm instalados
- Para Android: Android Studio con SDK
- Para iOS: macOS con Xcode instalado

#### Pasos de Build y Deploy

1. **Clonar y Setup**
```bash
git clone <your-repo>
cd <project-folder>
npm install
```

2. **Agregar Plataformas Móviles** (si no están agregadas)
```bash
npx cap add android
npx cap add ios
```

3. **Scripts Disponibles para Móvil**
```bash
# Build y sync todas las plataformas
npm run cap:sync

# Build y abrir Android Studio
npm run cap:android

# Build y abrir Xcode
npm run cap:ios
```

4. **Deploy a Dispositivo**
- **Android**: Usar Android Studio para ejecutar en emulador o dispositivo conectado
- **iOS**: Usar Xcode para ejecutar en simulador o dispositivo conectado

#### Características Específicas para Móvil

- **Native File Picker**: Usa `@capawesome/capacitor-file-picker` para seleccionar archivos .gguf
- **File System**: Los modelos se almacenan en `Documents/Models/` usando `@capacitor/filesystem`
- **UI Mobile-First**: Navegación con tabs inferiores, controles táctiles optimizados (≥44px), layout de una columna
- **Capacidad Offline**: Sin dependencias de red, funciona 100% localmente

#### Troubleshooting

- **Android**: Asegurar que USB debugging esté habilitado y el dispositivo sea reconocido
- **iOS**: Requiere cuenta de Apple Developer para deploy en dispositivo
- **File Access**: Otorgar permisos de almacenamiento cuando se solicite
- **Performance**: Usar nCtx recomendado (1024-2048) y nThreads (2-4) para dispositivos móviles

### Requisitos Móviles
- **Android**: Android Studio + SDK
- **iOS**: macOS + Xcode + iOS SDK

## 🧪 Testing del Mock

El mock está activo por defecto y simula:

1. **Importar modelo**: Archivos .gguf simulados con tamaños realistas
2. **Cargar en motor**: Delay de 2-3 segundos, luego estado "ready"
3. **Chat**: Respuestas bancarias en español con streaming
4. **System prompt**: Aplicación inmediata al motor mock
5. **Stop/Reset**: Control completo de la generación

## 🔄 Próximos Pasos

### Reemplazar Mock por Native Module

1. **Android (JNI Bridge)**:
   - Crear módulo nativo en `android/app/src/main/java/`
   - Integrar llama.cpp como biblioteca nativa
   - Implementar callbacks para streaming

2. **iOS (Swift/ObjC Bridge)**:
   - Crear módulo nativo en `ios/App/App/`
   - Integrar llama.cpp como framework
   - Implementar delegates para streaming

3. **Detección de Plataforma**:
   - Modificar `src/modules/local-llm/index.ts`
   - Detectar si es web (mock) o nativo (real)

### Estructura Native Modules

```
native/
├── android/
│   ├── LocalLLMModule.java
│   ├── LlamaEngine.cpp
│   └── CMakeLists.txt
├── ios/
│   ├── LocalLLMModule.swift
│   ├── LlamaEngine.mm
│   └── LlamaEngine-Bridging-Header.h
└── shared/
    └── llama.cpp/  # Submodule
```

## 📊 Estado Actual

- ✅ **UI Completa**: Todas las pantallas implementadas
- ✅ **Mock Funcional**: Testing completo sin motor real
- ✅ **Estado Persistente**: Configuración guardada en AsyncStorage
- ✅ **Capacitor Setup**: Listo para compilación móvil
- ✅ **Streaming UI**: Interface responsive con streaming de tokens
- ⏳ **Native Module**: Pendiente reemplazar mock por llama.cpp

## 🎨 Design System

- **Colores**: Tema oscuro con acentos azul/verde
- **Gradientes**: Sutiles para botones y cards
- **Tipografía**: Inter/Roboto optimizada para móvil
- **Animaciones**: Transiciones suaves y typing indicators
- **Responsive**: Optimizado para todas las pantallas

## 💡 Características Técnicas

- **Offline First**: Sin dependencias de red
- **Performance**: Optimizado para dispositivos con ≤4GB RAM
- **Persistence**: Estado guardado automáticamente
- **Error Handling**: Manejo robusto de errores y estados
- **TypeScript**: Tipado estricto en todo el proyecto
- **Mobile UX**: Interface táctil optimizada

---

**Estado del Proyecto**: ✅ **Listo para testing y desarrollo del Native Module**

El mock permite probar toda la funcionalidad mientras se desarrolla la integración real con llama.cpp.