---
layout: post
title: "Understanding functor via cats in scala"
date: 2018-09-15 22:05:47 0530
categories: functional programming scala
author: ScalaMill LLP
tags: scala, cats, functor
---

Hi,

{% highlight scala %}

package com.scalamill.meow.functor

import cats.Functor
import cats.instances.list._
import cats.instances.option._

case class BankAccount[T <: AccountType](accountType: T, balance: Int, status: String)

abstract class AccountType

class SavingsAccount extends AccountType

class SalaryAccount extends AccountType

class CurrentAccount extends AccountType

class SomeOtherAccount extends AccountType

object BankAccountFunctor {
  def map[A <: AccountType, B <: AccountType](fa: BankAccount[A])(f: A => B): BankAccount[B] = fa.copy(accountType = f(fa.accountType))
}

object FunctorExample extends App {

  val option = Some(1)

  val list = List(1, 2, 3)

  val listOption = List(Option(1), Option("34"), Option(3))

  println(Functor[Option].map(option)(x => x))

  println(Functor[List].map(list)(x => x + 1))

  println(Functor[List].compose[Option].map(listOption)(x => x + ""))

  val bankAccount1 = BankAccount(new SalaryAccount, 15000,"Running")

  val bankAccount2 = BankAccount[AccountType](new CurrentAccount, 4000 , "Running")

  val bankAccount3 = BankAccount[AccountType](new SalaryAccount, 60000, "Running")

  implicit val l = BankAccountFunctor

  val list2 = List(bankAccount1, bankAccount2, bankAccount3)

  println(BankAccountFunctor.map(bankAccount1)(x => new SalaryAccount))

  println(for {
    bankAccount <- list2
    if (bankAccount.balance < 5000)
  } yield BankAccountFunctor.map(bankAccount)(x => new SavingsAccount).copy(balance = 0, status =  "closed"))


  println(for {
    bankAccount <- list2
    if (bankAccount.balance < 20000 && bankAccount.balance > 4000)
  } yield BankAccountFunctor.map(bankAccount)(x => new SavingsAccount).copy(balance = bankAccount.balance - 1000))

  println(for {
    bankAccount <- list2
    if (bankAccount.balance > 50000)
  } yield BankAccountFunctor.map(bankAccount)(x => new CurrentAccount).copy(balance = bankAccount.balance + 5000))


  println(list2.map(x => BankAccountFunctor.map(x)(x => new CurrentAccount)))


}
{% endhighlight %}
