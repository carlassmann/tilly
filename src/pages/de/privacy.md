---
layout: ../../www/layouts/LegalPageLayout.astro
title: "Datenschutzerklärung"
description: "Datenschutzerklärung und Informationen zum Datenschutz für Tilly-Nutzer."
locale: "de"
---

# Datenschutzerklärung

_Stand: 27. Oktober 2026_

## Verantwortlicher

Carl Assmann - ccssmnn  
Muellritterstr. 10  
80995 München  
Deutschland  
E-Mail: assmann@hey.com

## Von Tilly verarbeitete Daten

### Benutzereingaben

- Persönliche Informationen, die du zu Tilly hinzufügst (Namen, Beziehungen, Notizen, Erinnerungen)
- Daten werden in deinem Browser verschlüsselt, bevor sie mit Jazz Cloud synchronisiert werden
- Verschlüsselungsschlüssel werden mit deinen Authentifizierungsdaten gespeichert, damit der Tilly-Server:
  - Erinnerungen entschlüsseln kann, um Push-Benachrichtigungen zu versenden
  - Chat-Inhalte verarbeiten und an Google für die Tilly-Chat-Funktionen weitergeben kann

### Authentifizierungsdaten

- Authentifizierungsmethode und Sitzungsinformationen, gespeichert von **Clerk**
- Verschlüsselungsschlüssel in Clerk gespeichert, um Zugang von neuen Geräten zu ermöglichen
- Tilly sammelt keine persönlichen Daten für Analysezwecke

### Zahlungsdaten

- Zahlungsabwicklung durch **Stripe**
- Tilly speichert deine Zahlungskartendaten nicht

## Drittanbieter-Dienste

### Syntwin-Websitebegleiter

Carls KI-Zwilling kann Tilly erklären und durch die Website und App führen. Dieser optionale Begleiter ist unabhängig vom Tilly Agent.

- Beim Laden einer Seite mit dem Begleiter wird Syntwin kontaktiert, um das Skript und die Raumeinstellungen abzurufen, bevor du ein Gespräch beginnst. Dabei erhält Syntwin Verbindungsdaten wie deine IP-Adresse und die Website-Herkunft.
- Nachrichten an den Begleiter werden in Syntwin verarbeitet und gespeichert. Anrufe werden transkribiert. Carl kann Gespräche einschließlich deines Feedbacks einsehen.
- Der Begleiter fragt um Erlaubnis, bevor er die Seite liest oder bedient. Mit deiner Zustimmung können sichtbare Seiteninhalte einschließlich angezeigter Journaldetails zur Hilfestellung an Syntwin übermittelt werden. Den Seitenzugriff kannst du im Begleiter widerrufen.
- Die Kontosteuerung in den Einstellungen ist vom Seitenzugriff ausgeschlossen. Passwort- und Kreditkartenfelder schließt die Einbettung aus.
- Gesprächsstatus und Zugriffsentscheidung werden im Sitzungsspeicher dieses Browsertabs gespeichert, damit das Gespräch beim Seitenwechsel weitergeht.
- Tillys Journalverschlüsselung verbirgt keine Seiteninhalte, die du mit dem Begleiter teilst. Für eine Einführung kannst du erfundene Beispiele verwenden.
- Datenschutzhinweis von Syntwin: https://my.syntwin.ai/de/legal/privacy

### Clerk (Authentifizierung)

- Verarbeitet Authentifizierung und speichert Verschlüsselungsschlüssel
- Datenschutzerklärung: https://clerk.com/privacy

### Stripe (Zahlungen)

- Verarbeitet Abonnementzahlungen
- Datenschutzerklärung: https://stripe.com/privacy

### Jazz Cloud (Datenspeicherung)

- Speichert deine verschlüsselten Beziehungsdaten
- Erhält ausschließlich Chiffren; die Entschlüsselung erfolgt auf Tilly-Servern mithilfe der von Clerk bereitgestellten Schlüssel, wenn dies für Funktionsumfang erforderlich ist

### Google Gemini (KI-Dienste)

- Verarbeitet Chat-Inhalte und Tool-Ergebnisse, die über Tilly-Server gesendet werden
- Daten werden nur gesendet, wenn du aktiv Tilly Chat-Funktionen nutzt
- Datenschutzerklärung: https://policies.google.com/privacy

## Rechtsgrundlage (DSGVO Artikel 6)

- **Vertragserfüllung** (Artikel 6(1)(b)): Bereitstellung von Tilly-Diensten
- **Berechtigte Interessen** (Artikel 6(1)(f)): Serviceverbesserung und Sicherheit

## Datenspeicherung

- Daten werden gespeichert, bis du dein Konto löschst
- Kontolöschung entfernt alle Daten und Verschlüsselungsschlüssel
- Backups werden automatisch innerhalb von 30 Tagen gelöscht

Gespräche mit dem Begleiter werden separat in Syntwin gespeichert. Das Löschen deines Tilly-Kontos löscht diese Gespräche nicht automatisch. Wende dich für die Löschung von Gesprächen an assmann@hey.com.

## Deine Rechte (DSGVO)

- **Zugriff** auf deine Daten jederzeit mit dem kostenlosen Tarif und Herunterladen deiner Daten
- **Berichtigung** unrichtiger Daten durch direktes Bearbeiten in Tilly
- **Löschung** deines Kontos und aller Daten durch Löschen deines Kontos über das Konto-Dashboard. Dies löscht die gespeicherten Verschlüsselungsschlüssel und macht deine Daten unzugänglich
- **Export** deiner Daten über das Einstellungsmenü jederzeit. Du kannst deine Daten dort auch importieren
- **Widerspruch** gegen die Verarbeitung durch Export deiner Daten und Löschen deines Kontos (da Tilly nicht ohne Verarbeitung deiner Beziehungsdaten funktionieren kann)
- **Einwilligung widerrufen** jederzeit durch Export deiner Daten und Löschen deines Kontos

## Datensicherheit

- Client-seitige Verschlüsselung mit Schlüsseln, die über Clerk für Mehrgeräte-Zugriff verwaltet werden; Tilly-Server greifen nur für Benachrichtigungen und KI-Funktionen auf entschlüsselte Daten zu
- Branchenübliche Sicherheitsmaßnahmen
- Regelmäßige Sicherheitsupdates

## Datenverarbeitungsorte

- **Push-Benachrichtigungen und Tilly Chat**: Verarbeitung in Deutschland; entschlüsselte Daten werden nur für die Dauer dieser Vorgänge genutzt
- **Verschlüsselte Synchronisationsdaten**: Gespeichert im Jazz-Cloud-Knoten mit der geringsten Latenz zu deinem Standort
- **Drittanbieter-Dienste**: Können Daten außerhalb der EU mit angemessenen Schutzmaßnahmen verarbeiten

## Cookies

Tilly verwendet nur wesentliche Cookies für die Authentifizierung. Es werden keine Tracking- oder Analyse-Cookies verwendet.

## Datenschutzbeauftragter

Carl Assmann  
Muellritterstr. 10  
80995 München  
Deutschland  
E-Mail: assmann@hey.com

## Kontakt

Für Datenschutzfragen oder zur Ausübung deiner Rechte:  
**E-Mail:** assmann@hey.com

## Aufsichtsbehörde

Du kannst Beschwerden beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA) einreichen.
