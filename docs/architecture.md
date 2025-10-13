# Architecture — BâtirNet

## Vue d’ensemble
BâtirNet adopte une architecture microservices exposée via une passerelle API (REST/GraphQL), avec stockage hybride (relationnel + NoSQL) et objets médias via CDN. Les clients Web et mobiles consomment les APIs via la gateway.

```mermaid
flowchart LR
  subgraph Client[Clients]
    W[Web (React/Vite)]
    M[Mobile (future)]
  end

  W --> AG
  M --> AG

  subgraph Edge[Edge/CDN]
    CDN[CDN & Static Assets]
  end
  W --- CDN

  subgraph AG[API Gateway]
    DIR[Routing / AuthZ / RateLimit]
  end

  subgraph SVC[Services]
    AUTH[Auth/KYC]
    MATCH[Matching IA]
    PRJ[Projets & Devis]
    CNT[Contrats]
    PAY[Paiements/Jalons]
    REV[Avis & Réputation]
    CMP[Conformité RBQ/Assurances]
    MSG[Messagerie]
    NOTIF[Notifications]
    ANA[Analytique]
  end

  AG --> AUTH
  AG --> MATCH
  AG --> PRJ
  AG --> CNT
  AG --> PAY
  AG --> REV
  AG --> CMP
  AG --> MSG
  AG --> NOTIF
  AG --> ANA

  subgraph Data[Data Layer]
    RDB[(RDBMS: contrats, paiements, transactions)]
    NOSQL[(NoSQL: activité, logs, métriques)]
    OBJ[(Objets: images, documents)]
  end

  AUTH <--> RDB
  PRJ <--> RDB
  CNT <--> RDB
  PAY <--> RDB
  REV <--> RDB
  ANA <--> NOSQL
  MSG <--> NOSQL
  ALL[[All Services]] --- OBJ

  subgraph Ext[Intégrations]
    STRP[[Stripe]]
    GEO[[Géoloc]]
    ESIGN[[E‑Signature]]
    RBQ[[RBQ/Assurances/Permis]]
  end

  PAY --- STRP
  PRJ --- GEO
  CNT --- ESIGN
  CMP --- RBQ
```

## Principes clés
- Séparation des responsabilités par domaine (contrats, paiements, conformité, etc.).
- Gateway centralise authN/authZ, journalisation, limitation de débit et agrégation.
- Observabilité: logs structurés, métriques, traces distribuées.
- Résilience: timeouts, retries, circuit breakers.
- Évolution: schémas versionnés, migrations automatisées, feature flags.

## API
- REST pour opérations CRUD et intégrations externes.
- GraphQL pour agrégations orientées UI (optimise les round‑trips).

## Données
- RDBMS pour transactions critiques (contrats, jalons, paiements).
- NoSQL pour événements, journaux et flux temps réel.
- Objets via stockage compatible S3 + CDN.

