"use strict"

const quiz = document.getElementById("quiz");
let cards = document.getElementsByClassName("card");
let quizCards = document.getElementsByClassName("quiz-api");
let optionsElements;
let nextButtons;
let counters;
let pointsGained = 0;
let countdownType = "";
let correctAnswers = [true];
let focusableArrays = []; 

if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

createQuestions();

async function createQuestions() {
    let response = await fetch("https://quizapi.io/api/v1/questions?apiKey=qt9GpHOhGOY91eTnWxb4CBrGUOrq807bGmipXFqh&tags=javascript&limit=10&multiple_correct_answers=false");
    let quizApi = await response.json();


    for (let [i, quizContent] of Object.entries(quizApi)) {
        getCorrectAnswer(quizContent);
        quizContent.answers = randomizeAnswers(quizContent.answers);
        insertQuestion(quizContent, i);
    }
    
    getTabIndexElements();
    optionsElements = quiz.getElementsByClassName("options");
    nextButtons = quiz.getElementsByClassName("next");
    counters = quiz.getElementsByClassName("counter");
    optionListeners();
    nextPageListener();
    document.getElementById("select").classList.remove("hidden");
}

function getCorrectAnswer(quizContent) {
    //index name of question.correct_answers with value true points us to the content of correct answer.
    let correctIndex = Object.entries(quizContent.correct_answers).find(answer => answer[1] === "true")[0];
    //But first we need to get rid of additional last word 
    correctIndex = correctIndex.split("_").slice(0, 2).join("_");
    correctAnswers.push(quizContent.answers[correctIndex]);
}

function randomizeAnswers(answers) {
    answers = Object.values(answers).filter(Boolean);
    let random, length = answers.length;

    while (length) {
        random = Math.floor(Math.random() * length--);
        [answers[length], answers[random]] = [answers[random], answers[length]];
    }

    return answers;
}

function insertQuestion(quizContent, index) {
    let quiestionHeader = escapeHtmlCharacters(quizContent.question);
    let optionButtons = "";

    for (let answer of quizContent.answers) {
        answer = escapeHtmlCharacters(answer);
        optionButtons += `<button class="option">${answer}</button>` + "\n";
    }


    quizCards[index].innerHTML = `<h2 class="question">${quiestionHeader}</h2>
    <div class="options">
        ${optionButtons}
    </div>
    <div class="progress">
        <button class="next hidden">Start</button> 
        <div class="counter"></div> 
    </div>`;
}

function escapeHtmlCharacters(htmlText) {
    let map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return htmlText.replace(/[&<>"']/g, char => map[char]);
}

function getTabIndexElements () { 
    for(let quizElement of quiz.children) {
        focusableArrays.push(quizElement.querySelectorAll("button, a"));
        // element.;
    }
    for(let [i, focusableArray] of Object.entries(focusableArrays)) {
        if (i != 0) {
            blockTabIndex(focusableArray);
        }
    }
}

function blockTabIndex(array) {
    for(let focusableElement of array) {
        focusableElement.tabIndex = "-1";
    }
}

function unblockTabIndex(array) {
    for(let focusableElement of array) {
        focusableElement.tabIndex = "1";
    }
}

function optionListeners() {
    for (let [i, options] of Object.entries(optionsElements)) {
        for (let [j, option] of Object.entries(options.children)) {
            option.addEventListener("click", () => {
                disableButtons(i);
                option.classList.add("clicked");
                
                if (i == 0) { //first questions is about difficulty. 
                    setDifficulty(j);
                } else {
                    checkAnswer(option.innerText, i);
                    if(i == 10) {
                        createFooter();
                    }
                }
            });
        }
    }
}

function nextPageListener() {
    // let scrollTimeout;
    for (let [i, nextButton] of Object.entries(nextButtons)) {
        i = +i;
        if (i === 11) {
            return;
        }   

        nextButton.addEventListener("click", (e) => {

            
            blockTabIndex(focusableArrays[i]);

            if(i < 9) {
                cards[i].addEventListener("animationend", () => {
                    counters[i + 1].classList.add(countdownType);
                    counters[i + 1].innerHTML = "";
                    unblockTabIndex(focusableArrays[i + 1]);
                })
            }   

            cards[i + 1].classList.remove("hidden-card");
            cards[i].classList.add("fade");
            
            
        })
    }
}

function setDifficulty (optionIndex) { 
    countdownType = optionIndex == 0 ? "count-down-easy" : "count-down-hard";

    for(let [i, counter] of Object.entries(counters)) {
        if(i != 0 && i != 11) { // only questions have working counters 
            counter.innerHTML = countdownType == "count-down-easy" ? 10 : 3;

            counter.addEventListener("animationend", (event) => {
                CheckForBeforeAnimation(event, i);
            });;
        }
    }
}

function CheckForBeforeAnimation(event, counterIndex) {
    if(event.pseudoElement == "::before") {
        disableButtons(counterIndex);
    }
}

function disableButtons(i) {
    nextButtons[i].classList.remove("hidden");
    for (let option of optionsElements[i].children) {
        option.disabled = true;
    }
}

function checkAnswer(answer, i) {
    let isAnswerCorrect = answer == correctAnswers[i];
    pointsGained += Number(isAnswerCorrect);

    counters[i].innerHTML = isAnswerCorrect ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
    counters[i].classList.remove("count-down-hard", "count-down-easy"); 

}

function createFooter() {
    let scoreComment; 

    if(pointsGained == 10) {
        scoreComment = "Perfect!";
    } else if (pointsGained > 7) {
        scoreComment = "Great Job!";
    } else if (pointsGained > 4) {
        scoreComment = "Nice score!";
    } else {
        scoreComment = "Ouch, Maybe next time.";
    }

    cards[11].innerHTML += `<h2>You scored ${pointsGained}/10!</h2>
    <p>${scoreComment} This Quiz was done for my dev.to <a target="_blank" href="https://dev.to/settings" target="_blank">blog post</a>, if you liked or disliked it I encourage you to leave your feedback in the comments.</p>
    <button class="next" id="refresh">Press F5 to Try Again</button>`;

    document.getElementById("refresh").addEventListener("click", () => {
        location.reload();
    })
}   
