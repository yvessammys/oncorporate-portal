# Setup do Portal de Constituição — OnCorporate

## Passo 1: Criar a Google Sheet

1. Vá a [Google Sheets](https://sheets.google.com) e crie uma nova spreadsheet
2. Dê o nome: **"Portal Constituições"**
3. Copie o ID da spreadsheet da URL:
   - URL: `https://docs.google.com/spreadsheets/d/ESTE_É_O_ID/edit`
4. Guarde este ID

## Passo 2: Criar a pasta no Google Drive

1. No [Google Drive](https://drive.google.com), crie uma nova pasta: **"Constituições - Portal"**
2. Abra a pasta e copie o ID da URL:
   - URL: `https://drive.google.com/drive/folders/ESTE_É_O_ID`
3. Guarde este ID

## Passo 3: Configurar o Google Apps Script

1. Vá a [Google Apps Script](https://script.google.com)
2. Crie um novo projeto: **"Portal Constituição Backend"**
3. Apague o conteúdo padrão do `Code.gs`
4. Copie o conteúdo de `google-apps-script/Code.gs` para o editor
5. Crie um novo ficheiro `FileUpload.gs` e cole o conteúdo de `google-apps-script/FileUpload.gs`
6. **Substitua os IDs** no início de `Code.gs`:
   - `SPREADSHEET_ID` → ID da Google Sheet (Passo 1)
   - `DRIVE_FOLDER_ID` → ID da pasta do Drive (Passo 2)
   - `NOTIFICATION_EMAIL` → o seu email

## Passo 4: Fazer Deploy do Apps Script

1. No editor do Apps Script, clique em **Deploy > New deployment**
2. Tipo: **Web app**
3. Description: "Portal v1"
4. Execute as: **Me** (a sua conta Google)
5. Who has access: **Anyone** (para que os clientes possam submeter)
6. Clique **Deploy**
7. Autorize o acesso quando solicitado
8. **Copie a URL** do Web App (algo como `https://script.google.com/macros/s/.../exec`)

## Passo 5: Configurar o Frontend

1. Abra `js/app.js`
2. Na primeira linha, substitua `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` pela URL do Passo 4

## Passo 6: Hospedar o Portal

### Opção A: GitHub Pages (recomendado, gratuito)
1. Crie um repositório no GitHub (ex: `portal-constituicao`)
2. Faça upload dos ficheiros `index.html`, `css/`, `js/`
3. Vá a Settings > Pages > Source: Deploy from branch > main
4. O portal ficará disponível em `https://seuuser.github.io/portal-constituicao`

### Opção B: Google Sites
1. Crie um Google Site
2. Adicione um bloco "Embed" com o HTML

### Opção C: Netlify (também gratuito)
1. Vá a [netlify.com](https://netlify.com)
2. Arraste a pasta `portal-constituicao` para o site
3. Receberá um URL automaticamente

## Passo 7: Testar

1. Abra o portal no browser
2. Preencha dados de teste
3. Verifique se:
   - Os dados aparecem na Google Sheet
   - A pasta foi criada no Google Drive
   - Recebeu o email de notificação

## Estrutura das pastas no Google Drive

Quando um cliente submete, a estrutura criada é:
```
Constituições - Portal/
  └── 2026-03-20_Nome-Sociedade/
      ├── formulario.json          ← Todos os dados do formulário
      ├── socios/                  ← Documentos dos sócios
      ├── gerentes/                ← Documentos dos gerentes
      └── documentos_gerados/      ← Onde a IA vai colocar os docs preenchidos
```

## Google Sheet

A sheet terá duas abas:
- **Constituições**: Resumo de cada submissão com link para a pasta
- **Detalhes**: Dados individuais de cada sócio e gerente

## Notas importantes

- O Google Apps Script tem limite de 6 min por execução e 50MB por request
- Para ficheiros grandes, o cliente pode ser instruído a fazer upload diretamente na pasta do Drive
- O email de confirmação é enviado automaticamente ao cliente e a si
- A sede será sempre Avenida 24 de Julho (definido internamente, não no formulário do cliente)
