# Définition des variables
NODE_PATH := node_modules/.bin
BUILD_DIR := build
SRC_DIR := src
DATA_DIR := data
SRV_DIR := srv
USER_DIR := user
DOCS_DIR := docs
MODELS_DIR := models



NODE_APP = index.js

COMMANDE1_MSG="✨ initialisation du serveur Telegram ✨"
COMMANDE2_MSG="✨ Connection Pi-Quantum ✨ "
COMMANDE3_MSG="✨ brainstorming generation d idées ✨"
COMMANDE4_MSG="✨ Initialisation du chatbot✨"
COMMANDE5_MSG="✨ Initialisation du Prompt Model"
COMMANDE6_MSG="🏗 Factory Generate Howto 📜 ✨"
COMMANDE7_MSG="🏗 Factory Start Building composant 📦 ✨"
COMMANDE9_MSG="✨ Mise à jour du repertoire sur github✨"
COMMANDEU_MSG="✨ Serveur User Telegram ✨"
COMMANDE10_MSG="✨Exit session✨"
COMMANDEa_MSG="✨Test F2✨"

# Ajoutez une règle pour chaque commande
commande1:
	@echo "${COMMANDE1_MSG}"
	@ssh universmc@192.168.1.33

commande2:
	@echo "${COMMANDE2_MSG}"
	@./Pibot.sh

commande3:
	@echo "${COMMANDE3_MSG}"
	@node .setup/did.js

commande4:
	@echo "${COMMANDE4_MSG}"
	@node .setup/chatCompletion.js

commande5:
	@echo "${COMMANDE5_MSG}"
	@node .setup/myprompt.js

commande6:
	@echo "${COMMANDE5_MSG}"
	@node build/howto.js

commande7:
	@echo "${COMMANDE5_MSG}"
	@node build/Composants.js

commande8:
	@echo "${COMMANDE5_MSG}"
	@node src/app/composer.js

commande9:
	@echo "${COMMANDE9_MSG}"
	@git add .
	@git commit -m "Update"
	@git push
	@echo "✨ Mise à jour terminée✨"
commande10:
	@echo "${COMMANDE10_MSG}"


menu :
	@echo "Welcom To cycliq Economical system."
	@echo""
	@echo"╔═════════════════════════════════════╗     ╔═════════════════════════════════════════════════════════════════════════════════════════╗"
	@echo"╠═══════════ ✨ Pi Console ═══════════╣     ║  [💫] [💬] [📚] [🌌] [✨] [⚡️] [💰] [🌴] [📱] [📡]                                      [🛰]║"
	@echo"║                                     ║     ╠═════════════════════════════════════════════════════════════════════════════════════════╣"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                          ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"║                                     ║     ║                                                                                         ║"
	@echo"╠═════════════════════════════════════╣     ╠═════════════════════════════════════════════════════════════════════════════════════════╣"
	@echo"║(∏)                                  ║     ║[💻.📱]:/<                                                                            /%>║"
	@echo"╚═════════════════════════════════════╝     ╚═════════════════════════════════════════════════════════════════════════════════════════╝"	
	@echo""

MAGIC_TARGETS := codex build rep file script clean

all: $(MAGIC_TARGETS)

srv : run start

start:
	@npm start
run:
	@node ./srv/srv.js


update:
	@echo "✨ Mise en état du dossier sur github✨"
	@git add .
	@git commit -m "update"
	@git push
	@echo "✨ Mise à jour terminée✨"
S1:
	@echo "✨ Mrun session brainstorming ✨"
	@git add .
	@git commit -m "sesssion brainstorm"
	@git push
	@echo "✨ Mise à jour terminée✨"

init: gantt phase1 phase2 phase3 phase4 phase5 phase6 phase7 phase8
# Magic COMPILER groq quantum
gantt:
	@echo "initialisation de l'instance"
	@git clone auto

phase1:
	@echo "phase de conception"
	@node mission.js

phase2:
	@echo "phase de configuration"
	@node configuration.js

phase3:
	@echo "phase d'entrainnement du model IA"
	@node models.js

phase4:
	@echo "phase de gestion et iteration du frontend"
	@git clone src.js
	
phase5:
	@echo "phase de gestion et iteration du backend"
	@node srv.js


phase6:
	@echo "phase de test et debugage"
	@node data.js

phase7:
	@echo "phase de validation documentation"
	@node models/modelcss.js

phase8:
	@echo "phase d'affiliation et contribution"
	@node models/modelcss.js

server:
	@node srv/Telegram/server.js
	@echo "Unleashing quantum Magic Mafile with every script we shape" 

# Ouvrez-vous aux dimensions cachées

clean-r:
	@echo "Returning the quantum realm to pristine state"
	@rm -rf data/* build/* src/* data/*

clean-R:
	@echo "Unweaving the fabric, a celestial fate"@rm -rf output/ build/ src/ data/

clean: clean-r clean-R
