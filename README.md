SMtest
=====

- git clone git@github.com:Animasola/SMtest.git
- mkvirtualenv dummy_test
- cd ./SMtest/
- pip install -r requirements.txt
- make syncdb
- make migrate
- make run