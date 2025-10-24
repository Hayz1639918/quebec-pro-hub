-- Script SQL pour créer des projets de test
-- Copiez ce contenu et exécutez-le dans Supabase SQL Editor

-- Récupérer l'ID du client avec l'email hayz1639918@gmail.com
DO $$
DECLARE
  v_client_id UUID;
  v_email TEXT;
BEGIN
  -- Récupérer le client avec l'email spécifique
  SELECT p.id, au.email 
  INTO v_client_id, v_email
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE au.email = 'hayz1639918@gmail.com';
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé avec l''email hayz1639918@gmail.com';
  END IF;
  
  RAISE NOTICE 'Client trouvé: % (ID: %)', v_email, v_client_id;
  
  -- Insérer les projets de test
  INSERT INTO projects (client_id, title, description, budget_min, budget_max, city, region, category, status)
  VALUES
    (v_client_id, 'Rénovation complète de cuisine moderne', 'Rénovation complète d''une cuisine avec îlot central, comptoirs en quartz, armoires sur mesure et électroménagers haut de gamme. Installation de plancher de céramique et nouveau système d''éclairage LED.', 30000, 40000, 'Montréal', 'Montréal', 'Cuisine et salle de bain', 'open'),
    
    (v_client_id, 'Construction d''un garage détaché', 'Construction d''un garage détaché 20x24 pieds avec porte de garage automatique, électricité, isolation et finition intérieure. Fondation en béton et toiture en bardeaux d''asphalte.', 40000, 50000, 'Laval', 'Laval', 'Construction neuve', 'open'),
    
    (v_client_id, 'Réfection de toiture résidentielle', 'Remplacement complet de la toiture d''une maison unifamiliale (2000 pi²). Retrait de l''ancienne couverture, installation de membrane pare-vapeur et pose de bardeaux architecturaux garantie 30 ans.', 10000, 14000, 'Québec', 'Québec', 'Toiture', 'open'),
    
    (v_client_id, 'Aménagement de sous-sol complet', 'Transformation d''un sous-sol en espace habitable avec 2 chambres, salle de bain complète, salle familiale et buanderie. Isolation, gypse, plancher flottant, électricité et plomberie.', 50000, 60000, 'Longueuil', 'Montérégie', 'Rénovation résidentielle', 'open'),
    
    (v_client_id, 'Installation de piscine creusée', 'Installation d''une piscine creusée en fibre de verre 16x32 pieds avec système de filtration au sel, patio en pavé uni et clôture de sécurité conforme aux normes québécoises.', 70000, 80000, 'Brossard', 'Montérégie', 'Paysagement', 'open'),
    
    (v_client_id, 'Rénovation de salle de bain luxueuse', 'Rénovation haut de gamme d''une salle de bain principale avec douche à l''italienne, bain autoportant, double vanité, plancher chauffant et robinetterie de luxe. Céramique grand format et éclairage moderne.', 25000, 32000, 'Saint-Laurent', 'Montréal', 'Cuisine et salle de bain', 'open'),
    
    (v_client_id, 'Extension de maison - Agrandissement', 'Agrandissement de 400 pi² au rez-de-chaussée pour créer une grande cuisine familiale ouverte sur le salon. Fondation, structure, toiture, électricité, plomberie et finitions complètes.', 90000, 100000, 'Terrebonne', 'Lanaudière', 'Construction neuve', 'open'),
    
    (v_client_id, 'Isolation et efficacité énergétique', 'Amélioration de l''efficacité énergétique d''une maison avec isolation de l''entre-toit (R-60), des murs extérieurs et du vide sanitaire. Remplacement de 12 fenêtres Energy Star et calfeutrage complet.', 28000, 36000, 'Repentigny', 'Lanaudière', 'Isolation', 'open'),
    
    (v_client_id, 'Aménagement paysager complet', 'Aménagement paysager résidentiel avec patio en pierre naturelle, muret de soutènement, plantation d''arbres et arbustes, système d''irrigation automatique et éclairage extérieur.', 20000, 25000, 'Blainville', 'Laurentides', 'Paysagement', 'open'),
    
    (v_client_id, 'Mise aux normes électriques complète', 'Remplacement complet du panneau électrique 200 ampères, mise à jour du filage en cuivre, installation de prises GFCI dans cuisine et salles de bain, détecteurs de fumée interconnectés conformes au Code.', 7000, 10000, 'Saint-Jean-sur-Richelieu', 'Montérégie', 'Électricité', 'open'),
    
    (v_client_id, 'Construction de terrasse extérieure', 'Construction d''une terrasse en composite (Trex) de 400 pi² avec deux niveaux, rampe en aluminium, éclairage intégré et escalier vers la cour. Pergola attachée pour zone ombragée.', 16000, 20000, 'Mirabel', 'Laurentides', 'Menuiserie', 'open'),
    
    (v_client_id, 'Remplacement de revêtement extérieur', 'Remplacement du revêtement extérieur en vinyle vieillissant par du canexel avec isolation ajoutée. Installation de nouvelles soffites et fascias en aluminium. Surface totale: 2500 pi².', 22000, 28000, 'Mascouche', 'Lanaudière', 'Rénovation résidentielle', 'open');
  
  RAISE NOTICE '✅ 12 projets de test créés avec succès!';
  
END $$;

